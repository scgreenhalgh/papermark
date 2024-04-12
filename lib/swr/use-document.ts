import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { DocumentWithVersion, LinkWithViews } from "@/lib/types";
import { View } from "@prisma/client";
import { useTeam } from "@/context/team-context";

export function useDocument() {
  const router = useRouter();
  const teamInfo = useTeam();

  const { id } = router.query as {
    id: string;
  };

  const { data: document, error } = useSWR<DocumentWithVersion>(
    teamInfo?.currentTeam?.id &&
      id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${encodeURIComponent(
        id,
      )}`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    document,
    primaryVersion: document?.versions[0],
    loading: !error && !document,
    error,
  };
}

export function useDocumentLinks() {
  const router = useRouter();
  const teamInfo = useTeam();

  const { id } = router.query as {
    id: string;
  };

  const { data: links, error } = useSWR<LinkWithViews[]>(
    teamInfo?.currentTeam?.id &&
      id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${encodeURIComponent(
        id,
      )}/links`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    links,
    loading: !error && !links,
    error,
  };
}

interface ViewWithDuration extends View {
  internal: boolean;
  duration: {
    data: { pageNumber: string; sum_duration: number }[];
  };
  totalDuration: number;
  completionRate: number;
  link: {
    name: string | null;
  };
}

export function useDocumentVisits() {
  const router = useRouter();
  const teamInfo = useTeam();

  const { id } = router.query as {
    id: string;
  };

  const { data: views, error } = useSWR<ViewWithDuration[]>(
    teamInfo?.currentTeam?.id &&
      id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${encodeURIComponent(
        id,
      )}/views`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    views,
    loading: !error && !views,
    error,
  };
}

interface DocumentProcessingStatus {
  currentPageCount: number;
  totalPages: number;
  hasPages: boolean;
}

export function useDocumentProcessingStatus(documentVersionId: string) {
  const teamInfo = useTeam();

  const { data: status, error } = useSWR<DocumentProcessingStatus>(
    `/api/teams/${teamInfo?.currentTeam?.id}/documents/document-processing-status?documentVersionId=${documentVersionId}`,
    fetcher,
    {
      refreshInterval: 3000, // refresh every 3 seconds
    },
  );

  return {
    status: status,
    loading: !error && !status,
    error: error,
  };
}

export function useDocumentThumbnail(pageNumber: number, documentId: string) {
  if (pageNumber === 0) {
    return {
      data: null,
      loading: false,
      error: null,
    };
  }
  const { data, error } = useSWR<{ imageUrl: string }>(
    `/api/jobs/get-thumbnail?documentId=${documentId}&pageNumber=${pageNumber}`,
    fetcher,
    {
      dedupingInterval: 1200000,
      revalidateOnFocus: false,
      // revalidateOnMount: false,
      revalidateIfStale: false,
      refreshInterval: 0,
    },
  );

  return {
    data,
    loading: !error && !data,
    error,
  };
}
