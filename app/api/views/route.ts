import { NextRequest, NextResponse } from "next/server";

// Import authOptions directly from the source
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { ipAddress, waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth";

import { hashToken } from "@/lib/api/auth/token";
import sendNotification from "@/lib/api/notification-helper";
import { recordVisit } from "@/lib/api/views/record-visit";
import { verifyPreviewSession } from "@/lib/auth/preview-auth";
import { PreviewSession } from "@/lib/auth/preview-auth";
import { sendOtpVerificationEmail } from "@/lib/emails/send-email-otp-verification";
import { getFile } from "@/lib/files/get-file";
import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { parseSheet } from "@/lib/sheet";
import { recordLinkView } from "@/lib/tracking/record-link-view";
import { CustomUser, WatermarkConfigSchema } from "@/lib/types";
import { checkPassword, decryptEncrpytedPassword, log } from "@/lib/utils";
import { generateOTP } from "@/lib/utils/generate-otp";
import { LOCALHOST_IP } from "@/lib/utils/geo";
import { getIpAddress } from "@/lib/utils/ip";
import { validateEmail } from "@/lib/utils/validate-email";

// Helper function to convert Headers to the expected format
export function headersToObject(headers: Headers): {
  [key: string]: string | string[] | undefined;
} {
  const result: { [key: string]: string | string[] | undefined } = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // POST /api/views
    const {
      linkId,
      documentId,
      userId,
      documentVersionId,
      documentName,
      hasPages,
      ownerId,
      ...data
    } = body as {
      linkId: string;
      documentId: string;
      userId: string | null;
      documentVersionId: string;
      documentName: string;
      hasPages: boolean;
      ownerId: string;
    };

    const { email, password, name, hasConfirmedAgreement } = data as {
      email: string;
      password: string;
      name?: string;
      hasConfirmedAgreement?: boolean;
    };

    // Add customFields to the data extraction
    const { customFields } = data as {
      customFields?: { [key: string]: string };
    };

    // INFO: for using the advanced excel viewer
    const { useAdvancedExcelViewer } = data as {
      useAdvancedExcelViewer: boolean;
    };

    // previewToken is used to determine if the view is a preview and therefore should not be recorded
    const { previewToken } = data as {
      previewToken?: string;
    };

    // Email Verification Data
    const { code, token, verifiedEmail } = data as {
      code?: string;
      token?: string;
      verifiedEmail?: string;
    };

    // Fetch the link to verify the settings
    const link = await prisma.link.findUnique({
      where: {
        id: linkId,
      },
      select: {
        emailProtected: true,
        enableNotification: true,
        emailAuthenticated: true,
        password: true,
        domainSlug: true,
        isArchived: true,
        slug: true,
        allowList: true,
        denyList: true,
        enableAgreement: true,
        agreementId: true,
        enableWatermark: true,
        watermarkConfig: true,
        teamId: true,
        team: {
          select: {
            plan: true,
          },
        },
        customFields: {
          select: {
            identifier: true,
            label: true,
          },
        },
      },
    });

    if (!link) {
      return NextResponse.json({ message: "Link not found." }, { status: 404 });
    }

    if (link.isArchived) {
      return NextResponse.json(
        { message: "Link is no longer available." },
        { status: 404 },
      );
    }

    // Check if email is required for visiting the link
    if (link.emailProtected) {
      if (!email || email.trim() === "") {
        return NextResponse.json(
          { message: "Email is required." },
          { status: 400 },
        );
      }

      // validate email
      if (!validateEmail(email)) {
        return NextResponse.json(
          { message: "Invalid email address." },
          { status: 400 },
        );
      }
    }

    // Check if password is required for visiting the link
    if (link.password) {
      if (!password || password.trim() === "") {
        return NextResponse.json(
          { message: "Password is required." },
          { status: 400 },
        );
      }

      let isPasswordValid: boolean = false;
      const textParts: string[] = link.password.split(":");
      if (!textParts || textParts.length !== 2) {
        isPasswordValid = await checkPassword(password, link.password);
      } else {
        const decryptedPassword = decryptEncrpytedPassword(link.password);
        isPasswordValid = decryptedPassword === password;
      }

      if (!isPasswordValid) {
        return NextResponse.json(
          { message: "Invalid password." },
          { status: 403 },
        );
      }
    }

    // Check if agreement is required for visiting the link
    if (link.enableAgreement && !hasConfirmedAgreement) {
      return NextResponse.json(
        { message: "Agreement to NDA is required." },
        { status: 400 },
      );
    }

    // Check if email is allowed to visit the link
    if (link.allowList && link.allowList.length > 0) {
      // Extract the domain from the email address
      const emailDomain = email.substring(email.lastIndexOf("@"));

      // Determine if the email or its domain is allowed
      const isAllowed = link.allowList.some((allowed) => {
        return (
          allowed === email ||
          (allowed.startsWith("@") && emailDomain === allowed)
        );
      });

      // Deny access if the email is not allowed
      if (!isAllowed) {
        return NextResponse.json(
          { message: "Unauthorized access" },
          { status: 403 },
        );
      }
    }

    // Check if email is denied to visit the link
    if (link.denyList && link.denyList.length > 0) {
      // Extract the domain from the email address
      const emailDomain = email.substring(email.lastIndexOf("@"));

      // Determine if the email or its domain is denied
      const isDenied = link.denyList.some((denied) => {
        return (
          denied === email || (denied.startsWith("@") && emailDomain === denied)
        );
      });

      // Deny access if the email is denied
      if (isDenied) {
        return NextResponse.json(
          { message: "Unauthorized access" },
          { status: 403 },
        );
      }
    }

    // Request OTP Code for email verification if
    // 1) email verification is required and
    // 2) code is not provided or token not provided
    if (link.emailAuthenticated && !code && !token) {
      const headerObj = headersToObject(request.headers);
      const ipAddress = getIpAddress(headerObj);

      const { success } = await ratelimit(10, "1 m").limit(
        `send-otp:${ipAddress}`,
      );
      if (!success) {
        return NextResponse.json(
          { message: "Too many requests. Please try again later." },
          { status: 429 },
        );
      }

      await prisma.verificationToken.deleteMany({
        where: {
          identifier: `otp:${linkId}:${email}`,
        },
      });

      const otpCode = generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // token expires at 10 minutes

      await prisma.verificationToken.create({
        data: {
          token: otpCode,
          identifier: `otp:${linkId}:${email}`,
          expires: expiresAt,
        },
      });

      waitUntil(sendOtpVerificationEmail(email, otpCode));
      return NextResponse.json({
        type: "email-verification",
        message: "Verification email sent.",
      });
    }

    let isEmailVerified: boolean = false;
    let hashedVerificationToken: string | null = null;
    if (link.emailAuthenticated && code) {
      const headerObj = headersToObject(request.headers);
      const ipAddress = getIpAddress(headerObj);
      const { success } = await ratelimit(10, "1 m").limit(
        `verify-otp:${ipAddress}`,
      );
      if (!success) {
        return NextResponse.json(
          { message: "Too many requests. Please try again later." },
          { status: 429 },
        );
      }

      // Check if the OTP code is valid
      const verification = await prisma.verificationToken.findUnique({
        where: {
          token: code,
          identifier: `otp:${linkId}:${email}`,
        },
      });

      if (!verification) {
        return NextResponse.json(
          {
            message: "Unauthorized access. Request new access.",
            resetVerification: true,
          },
          { status: 401 },
        );
      }

      // Check the OTP code's expiration date
      if (Date.now() > verification.expires.getTime()) {
        await prisma.verificationToken.delete({
          where: {
            token: code,
          },
        });
        return NextResponse.json(
          {
            message: "Access expired. Request new access.",
            resetVerification: true,
          },
          { status: 401 },
        );
      }

      // delete the OTP code after verification
      await prisma.verificationToken.delete({
        where: {
          token: code,
        },
      });

      // Create a email verification token for repeat access
      const token = newId("email");
      hashedVerificationToken = hashToken(token);
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 23); // token expires at 23 hours
      await prisma.verificationToken.create({
        data: {
          token: hashedVerificationToken,
          identifier: `link-verification:${linkId}:${link.teamId}:${email}`,
          expires: tokenExpiresAt,
        },
      });

      isEmailVerified = true;
    }

    if (link.emailAuthenticated && token) {
      const headerObj = headersToObject(request.headers);
      const ipAddress = getIpAddress(headerObj);
      const { success } = await ratelimit(10, "1 m").limit(
        `verify-email:${ipAddress}`,
      );
      if (!success) {
        return NextResponse.json(
          { message: "Too many requests. Please try again later." },
          { status: 429 },
        );
      }

      // Check if the long-term verification token is valid
      const verification = await prisma.verificationToken.findUnique({
        where: {
          token: token,
          identifier: `link-verification:${linkId}:${link.teamId}:${email}`,
        },
      });

      if (!verification) {
        return NextResponse.json(
          {
            message: "Unauthorized access. Request new access.",
            resetVerification: true,
          },
          { status: 401 },
        );
      }

      // Check the long-term verification token's expiration date
      if (Date.now() > verification.expires.getTime()) {
        // delete the long-term verification token after verification
        await prisma.verificationToken.delete({
          where: {
            token: token,
          },
        });
        return NextResponse.json(
          {
            message: "Access expired. Request new access.",
            resetVerification: true,
          },
          { status: 401 },
        );
      }

      isEmailVerified = true;
    }

    // Check if there's a valid preview session
    let previewSession: PreviewSession | null = null;
    let isPreview: boolean = false;
    if (previewToken) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json(
          { message: "You need to be logged in to preview the link." },
          { status: 401 },
        );
      }
      previewSession = await verifyPreviewSession(
        previewToken,
        (session.user as CustomUser).id,
        linkId,
      );

      console.log("previewSession", previewSession);
      if (!previewSession) {
        return NextResponse.json(
          {
            message: "Preview session expired or invalid. Request a new one.",
            resetPreview: true,
          },
          { status: 401 },
        );
      }
      isPreview = true;
    }

    try {
      let viewer: { id: string } | null = null;
      if (email && !isPreview) {
        // find or create a viewer
        console.time("find-viewer");
        viewer = await prisma.viewer.findUnique({
          where: {
            teamId_email: {
              teamId: link.teamId!,
              email: email,
            },
          },
          select: { id: true },
        });
        console.timeEnd("find-viewer");

        if (!viewer) {
          console.time("create-viewer");
          viewer = await prisma.viewer.create({
            data: {
              email: email,
              verified: isEmailVerified,
              teamId: link.teamId!,
            },
            select: { id: true },
          });
          console.timeEnd("create-viewer");
        }
      }

      let newView: { id: string } | null = null;
      if (!isPreview) {
        console.time("create-view");
        newView = await prisma.view.create({
          data: {
            linkId: linkId,
            viewerEmail: email,
            viewerName: name,
            documentId: documentId,
            teamId: link.teamId!,
            viewerId: viewer?.id ?? undefined,
            verified: isEmailVerified,
            ...(link.enableAgreement &&
              link.agreementId &&
              hasConfirmedAgreement && {
                agreementResponse: {
                  create: {
                    agreementId: link.agreementId,
                  },
                },
              }),
            ...(customFields &&
              link.customFields.length > 0 && {
                customFieldResponse: {
                  create: {
                    data: link.customFields.map((field) => ({
                      identifier: field.identifier,
                      label: field.label,
                      response: customFields[field.identifier] || "",
                    })),
                  },
                },
              }),
          },
          select: { id: true },
        });
        console.timeEnd("create-view");
      }

      // if document version has pages, then return pages
      // otherwise, return file from document version
      let documentPages, documentVersion;
      let sheetData;
      // let documentPagesPromise, documentVersionPromise;
      if (hasPages) {
        // get pages from document version
        console.time("get-pages");
        documentPages = await prisma.documentPage.findMany({
          where: { versionId: documentVersionId },
          orderBy: { pageNumber: "asc" },
          select: {
            file: true,
            storageType: true,
            pageNumber: true,
            embeddedLinks: !link.team?.plan.includes("free"),
            pageLinks: !link.team?.plan.includes("free"),
            metadata: true,
          },
        });

        documentPages = await Promise.all(
          documentPages.map(async (page) => {
            const { storageType, ...otherPage } = page;
            return {
              ...otherPage,
              file: await getFile({ data: page.file, type: storageType }),
            };
          }),
        );

        console.timeEnd("get-pages");
      } else {
        // get file from document version
        console.time("get-file");
        documentVersion = await prisma.documentVersion.findUnique({
          where: { id: documentVersionId },
          select: {
            file: true,
            storageType: true,
            type: true,
          },
        });

        if (!documentVersion) {
          return NextResponse.json(
            { message: "Document version not found." },
            { status: 404 },
          );
        }

        if (
          documentVersion.type === "pdf" ||
          documentVersion.type === "image" ||
          documentVersion.type === "video"
        ) {
          documentVersion.file = await getFile({
            data: documentVersion.file,
            type: documentVersion.storageType,
          });
        }

        if (documentVersion.type === "sheet") {
          if (useAdvancedExcelViewer) {
            documentVersion.file = documentVersion.file.includes("https://")
              ? documentVersion.file
              : `https://${process.env.NEXT_PRIVATE_ADVANCED_UPLOAD_DISTRIBUTION_HOST}/${documentVersion.file}`;
          } else {
            const fileUrl = await getFile({
              data: documentVersion.file,
              type: documentVersion.storageType,
            });

            const data = await parseSheet({ fileUrl });
            sheetData = data;
          }
        }
        console.timeEnd("get-file");
      }

      if (newView) {
        console.time("waitUntil");
        // INFO: create a header object because headers look different on nextapirequest vs nextrequest
        const headerObj = headersToObject(request.headers);
        // Record view in the background to avoid blocking the response
        waitUntil(
          Promise.all([
            // Record link view in Tinybird
            recordLinkView({
              req: request,
              clickId: newId("linkView"),
              viewId: newView.id,
              linkId,
              documentId,
            }),

            // Send notification to the document owner
            link.enableNotification
              ? sendNotification({ viewId: newView.id })
              : null,

            // Send webhook event
            recordVisit({
              viewId: newView.id,
              linkId,
              teamId: link.teamId!,
              documentId,
              headers: headerObj,
            }),
          ]),
        );
        console.timeEnd("waitUntil");
      }

      const returnObject = {
        message: "View recorded",
        viewId: !isPreview && newView ? newView.id : undefined,
        isPreview: isPreview ? true : undefined,
        file:
          (documentVersion &&
            (documentVersion.type === "pdf" ||
              documentVersion.type === "image" ||
              documentVersion.type === "zip" ||
              documentVersion.type === "video")) ||
          (documentVersion && useAdvancedExcelViewer)
            ? documentVersion.file
            : undefined,
        pages: documentPages ? documentPages : undefined,
        sheetData:
          documentVersion &&
          documentVersion.type === "sheet" &&
          !useAdvancedExcelViewer
            ? sheetData
            : undefined,
        fileType: documentVersion
          ? documentVersion.type
          : documentPages
            ? "pdf"
            : undefined,
        watermarkConfig: link.enableWatermark
          ? link.watermarkConfig
          : undefined,
        ipAddress:
          link.enableWatermark &&
          link.watermarkConfig &&
          WatermarkConfigSchema.parse(link.watermarkConfig).text.includes(
            "{{ipAddress}}",
          )
            ? process.env.VERCEL === "1"
              ? ipAddress(request)
              : LOCALHOST_IP
            : undefined,
        verificationToken: hashedVerificationToken ?? undefined,
      };

      return NextResponse.json(returnObject);
    } catch (error) {
      log({
        message: `Failed to record view for ${linkId}. \n\n ${error}`,
        type: "error",
        mention: true,
      });
      return NextResponse.json(
        { message: (error as Error).message },
        { status: 500 },
      );
    }
  } catch (error) {
    log({
      message: `Failed to process request. \n\n ${error}`,
      type: "error",
      mention: true,
    });
    return NextResponse.json(
      { message: (error as Error).message },
      { status: 500 },
    );
  }
}
