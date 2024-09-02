import { ChangeEvent, useCallback, useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { LinkPreset } from "@prisma/client";
import { Upload as ArrowUpTrayIcon } from "lucide-react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import useSWRImmutable from "swr/immutable";

import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import AppLayout from "@/components/layouts/app";
import Preview from "@/components/settings/og-preview";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";

import { usePlan } from "@/lib/swr/use-billing";
import { cn, convertDataUrlToFile, fetcher, uploadImage } from "@/lib/utils";
import { resizeImage } from "@/lib/utils/resize-image";

export default function Presets() {
  const teamInfo = useTeam();
  const { plan } = usePlan();
  const { data: presets, mutate: mutatePreset } = useSWRImmutable<LinkPreset>(
    `/api/teams/${teamInfo?.currentTeam?.id}/presets`,
    fetcher,
  );

  const [data, setData] = useState<{
    metaImage: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    enableCustomMetatag?: boolean;
  }>({
    metaImage: null,
    metaTitle: null,
    metaDescription: null,
    enableCustomMetatag: false,
  });

  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("presets", presets);
    if (presets) {
      setData({
        metaImage: presets.metaImage,
        metaTitle: presets.metaTitle,
        metaDescription: presets.metaDescription,
      });
    }
  }, [presets]);

  const onChangePicture = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      setFileError(null);
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (file.size / 1024 / 1024 > 5) {
          setFileError("File size too big (max 5MB)");
        } else if (file.type !== "image/png" && file.type !== "image/jpeg") {
          setFileError("File type not supported (.png or .jpg only)");
        } else {
          const image = await resizeImage(file);
          setData((prev) => ({
            ...prev,
            metaImage: image,
          }));
        }
      }
    },
    [setData],
  );

  const handleSavePreset = async (e: any) => {
    e.preventDefault();

    setIsLoading(true);

    let blobUrl: string | null =
      data.metaImage && data.metaImage.startsWith("data:")
        ? null
        : data.metaImage;
    if (data.metaImage && data.metaImage.startsWith("data:")) {
      const blob = convertDataUrlToFile({ dataUrl: data.metaImage });
      blobUrl = await uploadImage(blob);
      setData({ ...data, metaImage: blobUrl });
    }

    const res = await fetch(`/api/teams/${teamInfo?.currentTeam?.id}/presets`, {
      method: presets ? "PUT" : "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/presets`);
      setIsLoading(false);
      toast.success("Presets updated successfully");
      mutatePreset();
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    const res = await fetch(`/api/teams/${teamInfo?.currentTeam?.id}/presets`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      setData({
        metaImage: null,
        metaTitle: null,
        metaDescription: null,
        enableCustomMetatag: false,
      });
      setIsLoading(false);
      toast.success("Preset reset successfully");
      mutatePreset();
    }
  };

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />
        <div>
          <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Link Presets
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure your default link settings.
              </p>
            </div>
          </div>
          <div className="grid w-full gap-x-8 divide-x divide-border overflow-auto scrollbar-hide md:grid-cols-2 md:overflow-hidden">
            <div className="scrollbar-hide md:max-h-[95vh] md:overflow-auto">
              <div className="sticky top-0 z-10 flex h-10 items-center justify-center border-b border-border px-5 sm:h-14">
                <h2 className="text-lg font-medium">Social Media Card</h2>
              </div>
              <div className="relative mt-4 space-y-3 rounded-md">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="block text-sm font-medium text-foreground">
                      Image
                    </p>
                    {fileError ? (
                      <p className="text-sm text-red-500">{fileError}</p>
                    ) : null}
                  </div>
                  <label
                    htmlFor="image"
                    className="group relative mt-1 flex aspect-[1200/630] h-full min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-md border border-input bg-white shadow-sm transition-all hover:border-muted-foreground hover:bg-gray-50 hover:ring-muted-foreground dark:bg-gray-800 hover:dark:bg-transparent"
                  >
                    {false && (
                      <div className="absolute z-[5] flex h-full w-full items-center justify-center rounded-md bg-white">
                        <LoadingSpinner />
                      </div>
                    )}
                    <div
                      className="absolute z-[5] h-full w-full rounded-md"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragActive(true);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragActive(false);
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragActive(false);
                        setFileError(null);
                        const file =
                          e.dataTransfer.files && e.dataTransfer.files[0];
                        if (file) {
                          if (file.size / 1024 / 1024 > 5) {
                            setFileError("File size too big (max 5MB)");
                          } else if (
                            file.type !== "image/png" &&
                            file.type !== "image/jpeg"
                          ) {
                            setFileError(
                              "File type not supported (.png or .jpg only)",
                            );
                          } else {
                            const image = await resizeImage(file);
                            setData((prev) => ({
                              ...prev,
                              metaImage: image,
                            }));
                          }
                        }
                      }}
                    />
                    <div
                      className={cn(
                        "absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-md transition-all",
                        dragActive &&
                          "cursor-copy border-2 border-black bg-gray-50 opacity-100 dark:bg-transparent",
                        data.metaImage
                          ? "opacity-0 group-hover:opacity-100"
                          : "group-hover:bg-gray-50 group-hover:dark:bg-transparent",
                      )}
                    >
                      <ArrowUpTrayIcon
                        className={cn(
                          "h-7 w-7 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95",
                          dragActive ? "scale-110" : "scale-100",
                        )}
                      />
                      <p className="mt-2 text-center text-sm text-gray-500">
                        Drag and drop or click to upload.
                      </p>
                      <p className="mt-2 text-center text-sm text-gray-500">
                        Recommended: 1200 x 630 pixels (max 5MB)
                      </p>
                      <span className="sr-only">OG image upload</span>
                    </div>
                    {data.metaImage && (
                      <img
                        src={data.metaImage}
                        alt="Preview"
                        className="aspect-[1200/630] h-full w-full rounded-md object-cover"
                      />
                    )}
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={onChangePicture}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="block text-sm font-medium text-foreground">
                      Title
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {data.metaTitle?.length || 0}/120
                    </p>
                  </div>
                  <div className="relative mt-1 flex rounded-md shadow-sm">
                    {false && (
                      <div className="absolute flex h-full w-full items-center justify-center rounded-md border border-gray-300 bg-white">
                        <LoadingSpinner />
                      </div>
                    )}
                    <Input
                      name="title"
                      id="title"
                      maxLength={120}
                      className="focus:ring-inset"
                      placeholder={`Papermark - open-source document sharing infrastructure.`}
                      value={data.metaTitle || ""}
                      onChange={(e) => {
                        setData({ ...data, metaTitle: e.target.value });
                      }}
                      aria-invalid="true"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="block text-sm font-medium text-foreground">
                      Description
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {data.metaDescription?.length || 0}/240
                    </p>
                  </div>
                  <div className="relative mt-1 flex rounded-md shadow-sm">
                    {false && (
                      <div className="absolute flex h-full w-full items-center justify-center rounded-md border border-gray-300 bg-white">
                        <LoadingSpinner />
                      </div>
                    )}
                    <Textarea
                      name="description"
                      id="description"
                      rows={3}
                      maxLength={240}
                      className="focus:ring-inset"
                      placeholder={`Papermark is an open-source document sharing infrastructure for modern teams.`}
                      value={data.metaDescription || ""}
                      onChange={(e) => {
                        setData({
                          ...data,
                          metaDescription: e.target.value,
                        });
                      }}
                      aria-invalid="true"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  {plan === "free" ? (
                    <UpgradePlanModal
                      clickedPlan="Pro"
                      trigger={"branding_page"}
                    >
                      <Button>Upgrade to Save Preset</Button>
                    </UpgradePlanModal>
                  ) : (
                    <Button onClick={handleSavePreset} loading={isLoading}>
                      Save Preset
                    </Button>
                  )}

                  {presets ? (
                    <Button
                      variant="link"
                      onClick={handleDelete}
                      className="ml-2"
                      loading={isLoading}
                    >
                      Reset
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="scrollbar-hide md:max-h-[95vh] md:overflow-auto">
              <Preview data={data} setData={setData} />
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
