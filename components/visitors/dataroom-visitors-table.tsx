import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";

import { durationFormat, timeAgo } from "@/lib/utils";
import ChevronDown from "@/components/shared/icons/chevron-down";
import { VisitorAvatar } from "./visitor-avatar";
import { BadgeCheckIcon, BadgeInfoIcon, MailOpenIcon } from "lucide-react";
import { BadgeTooltip } from "@/components/ui/tooltip";
import { useDataroomVisits } from "@/lib/swr/use-dataroom";
import DataroomVisitHistory from "./dataroom-visitors-history";

export default function DataroomVisitorsTable({
  dataroomId,
}: {
  dataroomId: string;
}) {
  const { views } = useDataroomVisits({ dataroomId });

  return (
    <div className="w-full">
      <div>
        <h2 className="mb-2 md:mb-4">All visitors</h2>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent *:font-medium *:whitespace-nowrap">
              <TableHead>Name</TableHead>
              {/* <TableHead>Visit Duration</TableHead> */}
              {/* <TableHead>Last Viewed Document</TableHead> */}
              <TableHead>Last Viewed</TableHead>
              <TableHead className="text-center sm:text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {views?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="w-full h-40 flex items-center justify-center">
                    <p>No Data Available</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {views ? (
              views.map((view) => (
                <Collapsible key={view.id} asChild>
                  <>
                    <TableRow key={view.id} className="group/row">
                      {/* Name */}
                      <TableCell className="">
                        <div className="flex items-center sm:space-x-3 overflow-visible">
                          <VisitorAvatar viewerEmail={view.viewerEmail} />
                          <div className="min-w-0 flex-1">
                            <div className="focus:outline-none">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 overflow-visible flex items-center gap-x-2">
                                {view.viewerEmail ? (
                                  <>
                                    {view.viewerEmail}{" "}
                                    {view.verified && (
                                      <BadgeTooltip
                                        content="Verified visitor"
                                        key="verified"
                                      >
                                        <BadgeCheckIcon className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
                                      </BadgeTooltip>
                                    )}
                                    {view.internal && (
                                      <BadgeTooltip
                                        content="Internal visitor"
                                        key="internal"
                                      >
                                        <BadgeInfoIcon className="h-4 w-4 text-blue-500 hover:text-blue-600" />
                                      </BadgeTooltip>
                                    )}
                                  </>
                                ) : (
                                  "Anonymous"
                                )}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground/60">
                                {view.link.name ? view.link.name : view.linkId}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {/* Duration */}
                      {/* <TableCell className="">
                        <div className="text-sm text-muted-foreground">
                          {durationFormat(view.totalDuration)}
                        </div>
                      </TableCell> */}
                      {/* Completion */}
                      {/* <TableCell className="flex justify-start">
                        <div className="text-sm text-muted-foreground">
                          <Gauge
                            value={view.completionRate}
                            size={"small"}
                            showValue={true}
                          />
                        </div>
                      </TableCell> */}
                      {/* Last Viewed */}
                      <TableCell className="text-sm text-muted-foreground">
                        <time dateTime={new Date(view.viewedAt).toISOString()}>
                          {timeAgo(view.viewedAt)}
                        </time>
                      </TableCell>
                      {/* Actions */}
                      <TableCell className="text-center sm:text-right cursor-pointer p-0">
                        <CollapsibleTrigger asChild>
                          <div className="flex justify-end p-5 space-x-1 [&[data-state=open]>svg.chevron]:rotate-180">
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 chevron" />
                          </div>
                        </CollapsibleTrigger>
                      </TableCell>
                    </TableRow>

                    <CollapsibleContent asChild>
                      <>
                        <TableRow key={view.id}>
                          <TableCell>
                            <div className="flex items-center gap-x-4 overflow-visible">
                              <MailOpenIcon className="h-5 w-5 text-[#fb7a00]" />
                              Accessed {view.dataroomName} dataroom
                            </div>
                          </TableCell>

                          <TableCell>
                            <div>
                              <time
                                className="truncate text-sm text-muted-foreground"
                                dateTime={new Date(
                                  view.viewedAt,
                                ).toLocaleString()}
                                title={new Date(view.viewedAt).toLocaleString()}
                              >
                                {timeAgo(view.viewedAt)}
                              </time>
                            </div>
                          </TableCell>
                          <TableCell className="table-cell"></TableCell>
                        </TableRow>

                        <DataroomVisitHistory
                          viewId={view.id}
                          dataroomId={dataroomId}
                        />
                      </>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))
            ) : (
              <TableRow>
                <TableCell className="min-w-[100px]">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
                <TableCell className="min-w-[450px]">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
