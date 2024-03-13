import { useRouter } from "next/router";
import { FileTree } from "./ui/nextra-filetree";
import { FolderWithDocuments, useFolders } from "@/lib/swr/use-documents";
import { memo, useMemo } from "react";

// Helper function to build nested folder structure
const buildNestedFolderStructure = (folders: FolderWithDocuments[]) => {
  const folderMap = new Map();

  // Initialize every folder with an additional childFolders property
  folders.forEach((folder) => {
    folderMap.set(folder.id, { ...folder, childFolders: [] });
  });

  const rootFolders: FolderWithDocuments[] = [];

  folderMap.forEach((folder, id) => {
    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId);
      parent.childFolders.push(folder);
    } else {
      rootFolders.push(folder);
    }
  });

  return rootFolders;
};

const FolderComponent = memo(({ folder }: { folder: FolderWithDocuments }) => {
  const router = useRouter();

  // Memoize the rendering of the current folder's documents
  const documents = useMemo(
    () =>
      folder.documents.map((doc) => (
        <FileTree.File
          key={doc.id}
          name={doc.name}
          onToggle={() => router.push(`/documents/${doc.id}`)}
        />
      )),
    [folder.documents, router.query.name],
  );

  // Recursively render child folders if they exist
  const childFolders = useMemo(
    () =>
      folder.childFolders.map((childFolder) => (
        <FolderComponent key={childFolder.id} folder={childFolder} />
      )),
    [folder.childFolders],
  );

  return (
    <FileTree.Folder
      name={folder.name}
      key={folder.id}
      active={folder.path === "/" + (router.query.name as string[]).join("/")}
      childActive={router.query.name?.includes(folder.name)}
      onToggle={() => router.push(`/documents/tree${folder.path}`)}
    >
      {childFolders}
      {documents}
    </FileTree.Folder>
  );
});

const SidebarFolders = ({ folders }: { folders: FolderWithDocuments[] }) => {
  const nestedFolders = useMemo(() => {
    if (folders) {
      return buildNestedFolderStructure(folders);
    }
    return [];
  }, [folders]);

  return (
    <FileTree>
      {nestedFolders.map((folder) => (
        <FolderComponent key={folder.id} folder={folder} />
      ))}
    </FileTree>
  );
};

export default function SidebarFolderTree() {
  const { folders, error } = useFolders();

  if (!folders || error) return null;

  return <SidebarFolders folders={folders} />;
}
