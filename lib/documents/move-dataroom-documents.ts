import { toast } from "sonner";
import { mutate } from "swr";

export const moveDataroomDocumentToFolder = async ({
  documentIds,
  folderId,
  folderPathName,
  dataroomId,
  teamId,
}: {
  documentIds: string[];
  folderId: string;
  folderPathName: string[] | undefined;
  dataroomId: string;
  teamId?: string;
}) => {
  if (!teamId) {
    toast.error("Team is required to move documents");
    return;
  }

  console.log("moving documents to folder", documentIds, folderId);
  const key = `/api/teams/${teamId}/datarooms/${dataroomId}${folderPathName ? `/folders/documents/${folderPathName.join("/")}` : "/documents"}`;
  // Optimistically update the UI by removing the documents from current folder
  mutate(
    key,
    (documents: any[] | undefined) => {
      if (!documents) return documents;

      // Filter out the documents that are being moved
      const updatedDocuments = documents.filter(
        (doc) => !documentIds.includes(doc.id),
      );

      // Return the updated list of documents
      return updatedDocuments;
    },
    false,
  );

  try {
    // Make the API call to move the document
    const response = await fetch(
      `/api/teams/${teamId}/datarooms/${dataroomId}/documents/move`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds, folderId }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to move document");
    }

    const { updatedCount, newPath } = await response.json();

    // Update local data using SWR's mutate
    mutate(key);
    // update folder document counts in current path
    mutate(
      `/api/teams/${teamId}/datarooms/${dataroomId}/folders${folderPathName ? `/${folderPathName.join("/")}` : "?root=true"}`,
    );
    // update folder document counts in home
    !newPath &&
      mutate(`/api/teams/${teamId}/datarooms/${dataroomId}/folders?root=true`);
    // update documents in new folder (`newPath` or home)
    mutate(
      `/api/teams/${teamId}/datarooms/${dataroomId}${newPath ? `/folders/documents/${newPath}` : "/documents"}`,
    );

    toast.success(
      `${updatedCount} document${updatedCount > 1 ? "s" : ""} moved successfully`,
    );
  } catch (error) {
    toast.error("Failed to move documents");
    // Revert the UI back to the previous state
    mutate(key);
  }
};
