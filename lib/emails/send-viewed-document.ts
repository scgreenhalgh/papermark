import ViewedDocumentEmail from "@/components/emails/viewed-document";

import { sendEmail } from "@/lib/resend";

export const sendViewedDocumentEmail = async ({
  ownerEmail,
  documentId,
  documentName,
  viewerEmail,
  teamMembers,
}: {
  ownerEmail: string | null;
  documentId: string;
  documentName: string;
  viewerEmail: string | null;
  teamMembers?: string[];
}) => {
  const emailTemplate = ViewedDocumentEmail({
    documentId,
    documentName,
    viewerEmail,
  });
  try {
    if (!ownerEmail) {
      throw new Error("Document Owner not found");
    }

    let subjectLine: string = `Your document has been viewed: ${documentName}`;
    if (viewerEmail) {
      subjectLine = `${viewerEmail} viewed the document: ${documentName}`;
    }

    const data = await sendEmail({
      to: ownerEmail,
      cc: teamMembers,
      subject: subjectLine,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      system: true,
    });

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};
