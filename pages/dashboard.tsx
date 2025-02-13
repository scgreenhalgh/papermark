import { useRouter } from "next/router";

import { useRef, useState } from "react";

import { useTeam } from "@/context/team-context";
import { addDays, format } from "date-fns";
import { BarChart3, Eye, FileText, Link, Users } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

import { AnalyticsCard } from "@/components/analytics/analytics-card";
import DashboardViewsChart from "@/components/analytics/dashboard-views-chart";
import DocumentsTable from "@/components/analytics/documents-table";
import LinksTable from "@/components/analytics/links-table";
import {
  TimeRange,
  TimeRangeSelect,
} from "@/components/analytics/time-range-select";
import ViewsTable from "@/components/analytics/views-table";
import VisitorsTable from "@/components/analytics/visitors-table";
import AppLayout from "@/components/layouts/app";
import { TabMenu } from "@/components/tab-menu";

import { fetcher } from "@/lib/utils";

interface OverviewData {
  counts: {
    links: number;
    documents: number;
    visitors: number;
    views: number;
  };
  graph: {
    date: string;
    views: number;
  }[];
}
export const defaultRange = {
  start: addDays(new Date(), -7),
  end: addDays(new Date(), 0),
};

export default function DashboardPage() {
  const router = useRouter();
  const teamInfo = useTeam();
  const slug = useRef<boolean>(false);
  const [customRange, setCustomRange] = useState<{
    start: Date;
    end: Date;
  }>(defaultRange);

  const { interval = "7d", type = "links" } = router.query as {
    interval: TimeRange;
    type: string;
  };

  const {
    data: overview,
    isLoading,
    error,
  } = useSWR<OverviewData>(
    `/api/analytics?type=overview&interval=${interval}&teamId=${teamInfo?.currentTeam?.id}${interval === "custom" ? `&startDate=${format(customRange.start, "MM-dd-yyyy")}&endDate=${format(customRange.end, "MM-dd-yyyy")}` : ""}`,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  if (error && !slug.current) {
    const errorObj = JSON.parse(error.message);
    const errorMessage = errorObj?.error;
    toast.info(errorMessage);
    setCustomRange(defaultRange);
    slug.current = true;
  }

  // Update the URL when time range changes
  const handleTimeRangeChange = (newTimeRange: TimeRange) => {
    const params = new URLSearchParams(window.location.search);
    params.set("interval", newTimeRange);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <TimeRangeSelect
            value={interval}
            onChange={handleTimeRangeChange}
            customRange={customRange}
            setCustomRange={setCustomRange}
            slug={slug}
          />
        </div>

        <div className="space-y-4">
          <AnalyticsCard
            title="Views Overview"
            icon={<BarChart3 className="h-4 w-4" />}
            contentClassName="space-y-4"
          >
            <DashboardViewsChart
              timeRange={interval}
              data={overview?.graph}
              startDate={customRange.start}
              endDate={customRange.end}
            />
          </AnalyticsCard>

          <TabMenu
            navigation={[
              {
                label: "Links",
                href: `/dashboard?interval=${interval}&type=links`,
                value: "links",
                currentValue: type,
                count: overview?.counts.links,
              },
              {
                label: "Documents",
                href: `/dashboard?interval=${interval}&type=documents`,
                value: "documents",
                currentValue: type,
                count: overview?.counts.documents,
              },
              {
                label: "Visitors",
                href: `/dashboard?interval=${interval}&type=visitors`,
                value: "visitors",
                currentValue: type,
                count: overview?.counts.visitors,
              },
              {
                label: "Recent Visits",
                href: `/dashboard?interval=${interval}&type=views`,
                value: "views",
                currentValue: type,
                count: overview?.counts.views,
              },
            ]}
          />

          <div className="grid grid-cols-1">
            {type === "links" && (
              <LinksTable
                startDate={customRange.start}
                endDate={customRange.end}
              />
            )}
            {type === "documents" && (
              <DocumentsTable
                startDate={customRange.start}
                endDate={customRange.end}
              />
            )}
            {type === "visitors" && (
              <VisitorsTable
                startDate={customRange.start}
                endDate={customRange.end}
              />
            )}
            {type === "views" && (
              <ViewsTable
                startDate={customRange.start}
                endDate={customRange.end}
              />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
