import { useRouter } from "next/router";

import { useSession } from "next-auth/react";
import useSWR from "swr";

import { Team } from "@/lib/types";
import { fetcher } from "@/lib/utils";

export function useTeams() {
  const router = useRouter();
  const { data: session } = useSession();

  const { data: teams, isValidating } = useSWR<Team[]>(
    router.isReady && session && "/api/teams",
    fetcher,
    {
      dedupingInterval: 20000,
    },
  );

  return {
    teams,
    loading: teams ? false : true,
    isValidating,
  };
}
