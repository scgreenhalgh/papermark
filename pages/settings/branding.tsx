import AppLayout from "@/components/layouts/app";
import Navbar from "@/components/settings/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useTeam } from "@/context/team-context";
import { useCallback, useEffect, useState } from "react";
import { mutate } from "swr";
import { HexColorInput, HexColorPicker } from "react-colorful";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { PlusIcon } from "lucide-react";
import { useBrand } from "@/lib/swr/use-brand";
import { toast } from "sonner";
import { convertDataUrlToFile, uploadImage } from "@/lib/utils";
import { useRouter } from "next/router";
import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import { usePlan } from "@/lib/swr/use-billing";

export default function Branding() {
  const { brand } = useBrand();
  const teamInfo = useTeam();
  const router = useRouter();
  const { plan } = usePlan();

  const [brandColor, setBrandColor] = useState<string>("#000000");
  const [logo, setLogo] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const onChangeLogo = useCallback(
    (e: any) => {
      setFileError(null);
      const file = e.target.files[0];
      if (file) {
        if (file.size / 1024 / 1024 > 2) {
          setFileError("File size too big (max 2MB)");
        } else if (file.type !== "image/png" && file.type !== "image/jpeg") {
          setFileError("File type not supported (.png or .jpg only)");
        } else {
          const reader = new FileReader();
          reader.onload = (e) => {
            setLogo(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [setLogo],
  );

  useEffect(() => {
    if (brand) {
      setBrandColor(brand.brandColor || "#000000");
      setLogo(brand.logo || null);
    }
  }, [brand]);

  const saveBranding = async (e: any) => {
    e.preventDefault();

    setIsLoading(true);

    // Upload the image if it's a data URL
    let blobUrl: string | null = logo && logo.startsWith("data:") ? null : logo;
    if (logo && logo.startsWith("data:")) {
      // Convert the data URL to a blob
      const blob = convertDataUrlToFile({ dataUrl: logo });
      // Upload the blob to vercel storage
      blobUrl = await uploadImage(blob);
      setLogo(blobUrl);
    }

    const data = {
      brandColor: brandColor,
      logo: blobUrl,
    };

    const res = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/branding`,
      {
        method: brand ? "PUT" : "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (res.ok) {
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/branding`);
      setIsLoading(false);
      toast.success("Branding updated successfully");
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);

    const res = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/branding`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (res.ok) {
      setLogo(null);
      setBrandColor("#000000");
      setIsLoading(false);
      toast.success("Branding reset successfully");
      router.reload();
    }
  };

  return (
    <AppLayout>
      <Navbar current="Branding" />
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl text-foreground font-semibold tracking-tight">
              Branding
            </h3>
            <p className="text-sm text-muted-foreground">
              Customize how your brand appears globally across Papermark
              documents your visitors see.
            </p>
          </div>
        </div>
        <div>
          <Card className="dark:bg-secondary">
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="logo">
                      Logo{" "}
                      <span className="italic text-muted-foreground text-sm">
                        (max 2 MB)
                      </span>
                    </Label>
                    {fileError ? (
                      <p className="text-sm text-red-500">{fileError}</p>
                    ) : null}
                  </div>
                  <label
                    htmlFor="image"
                    className="group relative mt-1 flex h-[4rem] w-[12rem] cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50"
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
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragActive(false);
                        setFileError(null);
                        const file =
                          e.dataTransfer.files && e.dataTransfer.files[0];
                        if (file) {
                          if (file.size / 1024 / 1024 > 2) {
                            setFileError("File size too big (max 2MB)");
                          } else if (
                            file.type !== "image/png" &&
                            file.type !== "image/jpeg"
                          ) {
                            setFileError(
                              "File type not supported (.png or .jpg only)",
                            );
                          } else {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setLogo(e.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                    />
                    <div
                      className={`${
                        dragActive
                          ? "cursor-copy border-2 border-black bg-gray-50 opacity-100"
                          : ""
                      } absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-md bg-white transition-all ${
                        logo
                          ? "opacity-0 group-hover:opacity-100"
                          : "group-hover:bg-gray-50"
                      }`}
                    >
                      <PlusIcon
                        className={`${
                          dragActive ? "scale-110" : "scale-100"
                        } h-7 w-7 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95`}
                      />
                      <span className="sr-only">OG image upload</span>
                    </div>
                    {logo && (
                      <img
                        src={logo}
                        alt="Preview"
                        className="h-full w-full rounded-md object-contain"
                      />
                    )}
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/jpeg,image/png"
                      className="sr-only"
                      onChange={onChangeLogo}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="primary-color">Brand Color</Label>
                  <div className="flex space-x-1">
                    <Popover>
                      <PopoverTrigger>
                        <div
                          className="w-9 h-9 rounded-md cursor-pointer ring-1 ring-muted-foreground shadow-sm hover:ring-1 hover:ring-gray-300"
                          style={{ backgroundColor: brandColor }}
                        />
                      </PopoverTrigger>
                      <PopoverContent>
                        <HexColorPicker
                          color={brandColor}
                          onChange={setBrandColor}
                        />
                      </PopoverContent>
                    </Popover>
                    <HexColorInput
                      className="flex h-9 w-full rounded-md border-0 bg-background px-3 py-2 text-sm ring-1 ring-muted-foreground shadow-sm placeholder:text-muted-foreground focus:ring-1 focus:ring-gray-300 focus:border-0"
                      color={brandColor}
                      onChange={setBrandColor}
                      prefixed
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6">
              {plan && plan.plan === "free" ? (
                <UpgradePlanModal clickedPlan="Pro" trigger={"branding_page"}>
                  <Button>Upgrade to Save Branding</Button>
                </UpgradePlanModal>
              ) : (
                <Button onClick={saveBranding} loading={isLoading}>
                  Save changes
                </Button>
              )}
              {/* delete button */}
              <Button variant="link" onClick={handleDelete} disabled={!brand}>
                Reset branding
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
