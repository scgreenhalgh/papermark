import { useState } from "react";

import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import StatsCard from "@/components/datarooms/stats-card";
import AppLayout from "@/components/layouts/app";
import LinkSheet from "@/components/links/link-sheet";
import LinksTable from "@/components/links/links-table";
import { NavMenu } from "@/components/navigation-menu";
import { Button } from "@/components/ui/button";
import DataroomVisitorsTable from "@/components/visitors/dataroom-visitors-table";

import { useDataroom, useDataroomLinks } from "@/lib/swr/use-dataroom";

export default function DataroomPage() {
  const { dataroom } = useDataroom();
  const { links } = useDataroomLinks();

  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState<boolean>(false);

  if (!dataroom) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout>
      <div className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <header>
          <DataroomHeader
            title={dataroom.name}
            description={dataroom.pId}
            actions={[
              <Button onClick={() => setIsLinkSheetOpen(true)} key={1}>
                Create Link
              </Button>,
            ]}
          />

          <NavMenu
            navigation={[
              {
                label: "Overview",
                href: `/datarooms/${dataroom.id}`,
                segment: `${dataroom.id}`,
              },
              {
                label: "Documents",
                href: `/datarooms/${dataroom.id}/documents`,
                segment: "documents",
              },
              {
                label: "Users",
                href: `/datarooms/${dataroom.id}/users`,
                segment: "users",
              },
              {
                label: "Customization",
                href: `/datarooms/${dataroom.id}/branding`,
                segment: "branding",
              },
              {
                label: "Settings",
                href: `/datarooms/${dataroom.id}/settings`,
                segment: "settings",
              },
            ]}
          />
        </header>

        <div className="space-y-4">
          {/* Stats */}
          <StatsCard />

          {/* Links */}
          <LinksTable links={links} targetType={"DATAROOM"} />

          {/* Visitors */}
          <DataroomVisitorsTable dataroomId={dataroom.id} />

          <LinkSheet
            linkType={"DATAROOM_LINK"}
            isOpen={isLinkSheetOpen}
            setIsOpen={setIsLinkSheetOpen}
            existingLinks={links}
          />
        </div>
      </div>
    </AppLayout>
  );
}
