import { toast } from "sonner";
import { mutate } from "swr";

export const moveDocumentToFolder = async ({
  documentIds,
  folderId,
  folderPathName,
  teamId,
  folderIds,
}: {
  documentIds: string[];
  folderId: string;
  folderPathName?: string[];
  teamId?: string;
  folderIds?: string[];
}) => {
  if (!teamId) {
    toast.error("Team is required to move documents");
    return;
  }

  const key = `/api/teams/${teamId}${folderPathName ? `/folders/documents/${folderPathName.join("/")}` : "/documents"}`;
  // Optimistically update the UI by removing the documents from current folder
  mutate(
    key,
    (documents: any) => {
      if (!documents) return documents;

      // Filter out the documents that are being moved
      const updatedDocuments = documents.filter(
        (doc: any) => !documentIds.includes(doc.id),
      );

      // Return the updated list of documents
      return updatedDocuments;
    },
    false,
  );
  // Instant Update the UI
  const folderKey = `/api/teams/${teamId}${folderPathName ? `/folders/${folderPathName.join("/")}` : "/folders?root=true"}`;
  if (folderIds) {
    mutate(
      folderKey,
      (folder: any) => {
        if (!folder) return folder;
        // Filter out the folder that are being moved
        interface Folder {
          id: string;
        }

        const updatedFolder: Folder[] = folder.filter(
          (f: Folder) => !folderIds.includes(f.id),
        );
        // Return the updated list of folder
        return updatedFolder;
      },
      false,
    );
  }
  try {
    // Make the API call to move the document
    const response = await fetch(`/api/teams/${teamId}/documents/move`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentIds, folderId }),
    });

    if (!response.ok) {
      throw new Error("Failed to move document");
    }

    const { updatedCount, newPath } = await response.json();

    // Update local data using SWR's mutate
    mutate(key);
    if (folderIds) {
      mutate(folderKey);
    }
    // update folder document counts in current path
    mutate(
      `/api/teams/${teamId}/folders${folderPathName ? `/${folderPathName.join("/")}` : "?root=true"}`,
    );
    // update documents in new folder (or home)
    mutate(
      `/api/teams/${teamId}${newPath ? `/folders/documents/${newPath}` : "/documents"}`,
    );
    toast.success(
      `${updatedCount} document${updatedCount > 1 ? "s" : ""} moved successfully`,
    );
  } catch (error) {
    toast.error("Failed to move documents");
    // Revert the UI back to the previous state
    mutate(key);
    if (folderIds) {
      mutate(folderKey);
    }
  }
};
