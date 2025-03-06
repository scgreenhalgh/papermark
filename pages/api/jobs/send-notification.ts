import { NextApiRequest, NextApiResponse } from "next";

import { sendViewedDataroomEmail } from "@/lib/emails/send-viewed-dataroom";
import { sendViewedDocumentEmail } from "@/lib/emails/send-viewed-document";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

export const config = {
  maxDuration: 60,
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  // Extract the API Key from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1]; // Assuming the format is "Bearer [token]"

  // Check if the API Key matches
  if (token !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { viewId, locationData } = req.body as {
    viewId: string;
    locationData: {
      continent: string | null;
      country: string;
      region: string;
      city: string;
    };
  };

  let view: {
    viewType: "DOCUMENT_VIEW" | "DATAROOM_VIEW";
    viewerEmail: string | null;
    linkId: string;
    link: { name: string | null } | null;
    document: {
      teamId: string | null;
      id: string;
      name: string;
    } | null;
    dataroom: {
      teamId: string | null;
      id: string;
      name: string;
    } | null;
    team: {
      plan: string | null;
    } | null;
  } | null;

  try {
    // Fetch the view with data
    view = await prisma.view.findUnique({
      where: {
        id: viewId,
      },
      select: {
        viewType: true,
        viewerEmail: true,
        linkId: true,
        link: {
          select: {
            name: true,
          },
        },
        document: {
          select: {
            teamId: true,
            id: true,
            name: true,
          },
        },
        dataroom: {
          select: {
            teamId: true,
            id: true,
            name: true,
          },
        },
        team: {
          select: {
            plan: true,
          },
        },
      },
    });

    if (!view) {
      res.status(404).json({ message: "View not found." });
      return;
    }
  } catch (error) {
    log({
      message: `Failed to find document / dataroom view for viewId: ${viewId}. \n\n Error: ${error}`,
      type: "error",
      mention: true,
    });
    res.status(500).json({ message: (error as Error).message });
    return;
  }

  const teamId =
    view.viewType === "DOCUMENT_VIEW"
      ? view.document!.teamId!
      : view.dataroom!.teamId!;

  // Get all team members who are admins or managers to be notified
  const users = await prisma.userTeam.findMany({
    where: {
      role: { in: ["ADMIN", "MANAGER"] },
      teamId: teamId,
    },
    select: {
      role: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  const includeLocation =
    !view.team?.plan?.includes("free") &&
    !view.team?.plan?.includes("starter") &&
    !view.team?.plan?.includes("pro");

  const locationString =
    locationData.country === "US"
      ? `${locationData.city}, ${locationData.region}, ${locationData.country}`
      : `${locationData.city}, ${locationData.country}`;

  // POST /api/jobs/send-notification
  try {
    const adminEmail = users.find((user) => user.role === "ADMIN")?.user.email;

    if (view.viewType === "DOCUMENT_VIEW") {
      // send email to document owner that document
      await sendViewedDocumentEmail({
        ownerEmail: adminEmail!,
        documentId: view.document!.id,
        documentName: view.document!.name,
        linkName: view.link!.name || `Link #${view.linkId.slice(-5)}`,
        viewerEmail: view.viewerEmail,
        teamMembers: users
          .map((user) => user.user.email!)
          .filter((email) => email !== adminEmail),
        locationString: includeLocation ? locationString : undefined,
      });
    } else {
      // send email to dataroom owner that dataroom
      await sendViewedDataroomEmail({
        ownerEmail: adminEmail!,
        dataroomId: view.dataroom!.id,
        dataroomName: view.dataroom!.name,
        viewerEmail: view.viewerEmail,
        linkName: view.link!.name || `Link #${view.linkId.slice(-5)}`,
        teamMembers: users
          .map((user) => user.user.email!)
          .filter((email) => email !== adminEmail),
        locationString: includeLocation ? locationString : undefined,
      });
    }

    res.status(200).json({ message: "Successfully sent notification", viewId });
    return;
  } catch (error) {
    log({
      message: `Failed to send email in _/api/views_ route for linkId: ${view.linkId}. \n\n Error: ${error} \n\n*Metadata*: \`{teamId: ${teamId}, viewId: ${viewId}}\``,
      type: "error",
      mention: true,
    });
    return res.status(500).json({ message: (error as Error).message });
  }
}
