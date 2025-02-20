import { useState } from "react";

import {
  FileJson,
  FileSlidersIcon,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import {
  PlanEnum,
  UpgradePlanModal,
} from "@/components/billing/upgrade-plan-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";
import { useDataroomLinks } from "@/lib/swr/use-dataroom";
import { IndexFileFormat } from "@/lib/types/index-file";

interface GenerateIndexDialogProps {
  teamId: string;
  dataroomId: string;
  disabled?: boolean;
}

export default function GenerateIndexDialog({
  teamId,
  dataroomId,
  disabled = false,
}: GenerateIndexDialogProps) {
  const { links } = useDataroomLinks();
  const { plan, trial } = usePlan();
  const analytics = useAnalytics();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedLinkId, setSelectedLinkId] = useState<string>("");
  const [selectedFormat, setSelectedFormat] =
    useState<IndexFileFormat>("excel");
  const [isOpen, setIsOpen] = useState(false);

  const hasDataroomsPlan = plan === "datarooms" || trial;

  const handleGenerateIndex = async () => {
    if (!hasDataroomsPlan) {
      toast.error("Upgrade to a Data Rooms plan to generate index files.");
      return;
    }

    if (!selectedLinkId) {
      toast.error("Please select a link first");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/teams/${teamId}/datarooms/${dataroomId}/generate-index`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            format: selectedFormat,
            linkId: selectedLinkId,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate index");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition?.split("filename=")[1] || "index";

      // Create a blob from the response
      const blob = await response.blob();

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      analytics.capture("Generate Index File", {
        teamId,
        dataroomId,
        linkId: selectedLinkId,
        format: selectedFormat,
      });

      toast.success("Index file generated successfully");
      setIsOpen(false);
    } catch (error) {
      console.error("Error generating index:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate index",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const activeLinks = links?.filter((link) => !link.isArchived) || [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <FileSlidersIcon />
          Generate Index File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Dataroom Index File</DialogTitle>
          <DialogDescription>
            {hasDataroomsPlan
              ? "Select a link and format to generate the index file."
              : "Upgrade to a Data Rooms plan to generate index files."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Select Link</h4>
            <Select
              value={selectedLinkId}
              onValueChange={(value) => setSelectedLinkId(value)}
            >
              <SelectTrigger className="text-left">
                <SelectValue placeholder="Select a link" />
              </SelectTrigger>
              <SelectContent className="max-h-[50vh] overflow-y-scroll">
                {activeLinks.map((link) => (
                  <SelectItem key={link.id} value={link.id}>
                    <div className="flex flex-col space-y-1">
                      <span>{link.name || `Link #${link.id.slice(-5)}`}</span>
                      <span className="text-xs text-muted-foreground">
                        {link.domainId
                          ? `${link.domainSlug}/${link.slug}`
                          : `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${link.id}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Select Format</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedFormat === "excel" ? "default" : "outline"}
                onClick={() => {
                  setSelectedFormat("excel");
                }}
                className="justify-start"
                size="sm"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button
                variant={selectedFormat === "csv" ? "default" : "outline"}
                onClick={() => setSelectedFormat("csv")}
                className="justify-start"
                size="sm"
              >
                <FileText className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                variant={selectedFormat === "json" ? "default" : "outline"}
                onClick={() => setSelectedFormat("json")}
                className="justify-start"
                size="sm"
              >
                <FileJson className="mr-2 h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          {hasDataroomsPlan ? (
            <Button
              onClick={handleGenerateIndex}
              disabled={!selectedLinkId || isLoading}
            >
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          ) : (
            <UpgradePlanModal
              clickedPlan={PlanEnum.DataRooms}
              trigger="datarooms_generate_index_button"
            >
              <Button>Upgrade to generate</Button>
            </UpgradePlanModal>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
