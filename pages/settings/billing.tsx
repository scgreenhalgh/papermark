import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import AppLayout from "@/components/layouts/app";
import Navbar from "@/components/settings/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTeam } from "@/context/team-context";
import { useAnalytics } from "@/lib/analytics";
import { useBilling } from "@/lib/swr/use-billing";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const frequencies: {
  value: "monthly" | "annually";
  label: "Monthly" | "Annually";
  priceSuffix: "/month" | "/month";
}[] = [
  { value: "monthly", label: "Monthly", priceSuffix: "/month" },
  { value: "annually", label: "Annually", priceSuffix: "/month" },
];

export default function Billing() {
  const router = useRouter();
  const analytics = useAnalytics();
  const { plan, startsAt, endsAt } = useBilling();
  const [clicked, setClicked] = useState<boolean>(false);
  const frequency = frequencies[1];

  const [toggleProYear, setToggleProYear] = useState<boolean>(true);
  const [toggleBusinessYear, setToggleBusinessYear] = useState<boolean>(true);
  const [frequencyPro, setFrequencyPro] = useState(frequencies[0]);
  const [frequencyBusiness, setFrequencyBusiness] = useState(frequencies[0]);

  useEffect(() => {
    if (toggleProYear) {
      setFrequencyPro(frequencies[1]);
    } else {
      setFrequencyPro(frequencies[0]);
    }

    if (toggleBusinessYear) {
      setFrequencyBusiness(frequencies[1]);
    } else {
      setFrequencyBusiness(frequencies[0]);
    }
  }, [toggleProYear, toggleBusinessYear]);

  const teamInfo = useTeam();

  useEffect(() => {
    if (router.query.success) {
      toast.success("Upgrade success!");
      analytics.capture("User Upgraded", {
        plan: plan,
        teamId: teamInfo?.currentTeam?.id,
        $set: { teamId: teamInfo?.currentTeam?.id, teamPlan: plan },
      });
    }

    if (router.query.cancel) {
      analytics.capture("Stripe Checkout Cancelled", {
        teamId: teamInfo?.currentTeam?.id,
      });
    }
  }, [router.query]);

  const tiers: {
    name: string;
    id: string;
    href: string;
    currentPlan: boolean;
    price: {
      monthly: string;
      annually: string;
    };
    description: string;
    featureIntro: string;
    features: string[];
    bgColor: string;
    borderColor: string;
    textColor: string;
    buttonText: string;
    mostPopular: boolean;
  }[] = [
    {
      name: "Free",
      id: "tier-free",
      href: "/login",
      currentPlan: plan && plan == "free" ? true : false,
      price: { monthly: "€0", annually: "€0" },
      description: "The essentials to start sharing documents securely.",
      featureIntro: "What's included:",
      features: [
        "1 user",
        "Unlimited links",
        "Page-by-page analytics",
        "30-day analytics retention",
        "Document sharing controls",
      ],

      bgColor: "bg-gray-200",
      borderColor: "#bg-gray-800",
      textColor: "#bg-gray-800",
      buttonText: "Start for free",
      mostPopular: false,
    },
    {
      name: "Pro",
      id: "tier-pro",
      href: "/login",
      currentPlan: plan && plan == "pro" ? true : false,
      price: { monthly: "€39", annually: "€25" },
      description: "The branded experience for your documents.",
      featureIntro: "Everything in Free, plus:",
      features: [
        "2 users",
        "Custom slug",
        "Custom branding",
        "1-year analytics retention",
        "Advanced access controls",
        "Folder organization",
      ],
      bgColor: "bg-gray-200",
      borderColor: "#bg-gray-800",
      textColor: "#bg-gray-800",
      buttonText: "Upgrade to Pro",
      mostPopular: false,
    },
    {
      name: "Business",
      id: "tier-business",
      href: "/login",
      currentPlan: plan && plan == "business" ? true : false,
      price: { monthly: "€79", annually: "€59" },
      description:
        "The one for more control, data room, and multi-file sharing.",
      featureIntro: "Everything in Pro, plus:",
      features: [
        "3 users",
        "1 dataroom",
        "Multi-file sharing",
        "Custom domain",
        "Unlimited documents",
        "Unlimited subfolder levels",
        "Large file uploads",
        "48h Priority Support",
      ],
      bgColor: "#fb7a00",
      borderColor: "#fb7a00",
      textColor: "#black",
      buttonText: "Upgrade to Business",
      mostPopular: true,
    },
  ];

  const enterpriseFeatures = [
    "Self-hosted version",
    "Unlimited users",
    "Unlimited documents",
    "Unlimited folders and subfolders",
    "Unlimited datarooms",
    "Full white-labeling",
    "Up to 5TB file uploads",
    "Dedicated support",
    "Custom Onboarding",
  ];

  return (
    <AppLayout>
      <Navbar current="Billing" />

      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl text-foreground font-semibold tracking-tight">
              Billing
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage your subscription and billing information.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900">
          <div className="mx-auto space-y-8">
            <div className="isolate grid grid-cols-1 md:grid-cols-3 border border-black dark:border-muted-foreground rounded-xl overflow-hidden">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="border-black dark:border-muted-foreground border-r-0 md:border-r md:last:!border-r-0 flex flex-col justify-between"
                >
                  <div>
                    <div className="border-b border-black p-6 bg-gray-100 dark:bg-gray-800 dark:border-muted-foreground">
                      <h3
                        id={tier.id}
                        className="text-balance text-foreground text-xl leading-8 flex items-center gap-x-2"
                      >
                        <span>{tier.name}</span>
                        {tier.currentPlan ? (
                          <Badge className="rounded-md">Current Plan</Badge>
                        ) : null}
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="mt-2 min-h-20">
                        {tier.id === "tier-free" ? (
                          <div className="min-h-12">
                            <div className="flex flex-col text-sm">
                              <div className="h-6"></div>
                              <h4>No credit card required</h4>
                            </div>
                          </div>
                        ) : null}
                        {tier.id === "tier-pro" ? (
                          <div className="min-h-12">
                            <Switch
                              className="h-5 w-10 *:size-4"
                              checked={toggleProYear}
                              onCheckedChange={() =>
                                setToggleProYear(!toggleProYear)
                              }
                            />
                            <div className="flex items-center gap-x-1 text-sm mb-1">
                              <span
                                className={cn(
                                  toggleProYear
                                    ? "text-gray-400"
                                    : "text-black",
                                )}
                              >
                                Monthly
                              </span>
                              <span>|</span>
                              <span
                                className={cn(
                                  toggleProYear
                                    ? "text-black"
                                    : "text-gray-400",
                                )}
                              >
                                Annually
                              </span>
                            </div>
                            <div
                              className={cn(
                                "relative text-xs w-fit uppercase border border-gray-900 text-gray-900 rounded-3xl px-1.5 py-0.5",
                                !toggleProYear &&
                                  "border-gray-400 text-gray-400 opacity-40",
                              )}
                            >
                              <span
                                className={cn(
                                  !toggleProYear
                                    ? "absolute top-1/2 h-px w-[90%] bg-gray-400"
                                    : "hidden",
                                )}
                              />
                              35% Saving
                            </div>
                          </div>
                        ) : null}
                        {tier.id === "tier-business" ? (
                          <div className="min-h-12">
                            <Switch
                              className="h-5 w-10 *:size-4"
                              checked={toggleBusinessYear}
                              onCheckedChange={() =>
                                setToggleBusinessYear(!toggleBusinessYear)
                              }
                            />
                            <div className="flex items-center gap-x-1 text-sm mb-1">
                              <span
                                className={cn(
                                  toggleBusinessYear
                                    ? "text-gray-400"
                                    : "text-black",
                                )}
                              >
                                Monthly
                              </span>
                              <span>|</span>
                              <span
                                className={cn(
                                  toggleBusinessYear
                                    ? "text-black"
                                    : "text-gray-400",
                                )}
                              >
                                Annually
                              </span>
                            </div>
                            <div
                              className={cn(
                                "relative text-xs w-fit uppercase border border-[#fb7a00] text-[#fb7a00] rounded-3xl px-1.5 py-0.5",
                                !toggleBusinessYear &&
                                  "border-gray-400 text-gray-400 opacity-40",
                              )}
                            >
                              <span
                                className={cn(
                                  !toggleBusinessYear
                                    ? "absolute top-1/2 h-px w-[90%] bg-gray-400"
                                    : "hidden",
                                )}
                              />
                              25% Saving
                            </div>
                          </div>
                        ) : null}
                        {tier.id === "tier-enterprise" ? (
                          <div className="min-h-12">
                            <div className="flex flex-col text-sm">
                              <div className="h-6"></div>
                              <h4>Get in touch</h4>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <p className="mt-6 flex items-baseline gap-x-1">
                        <span
                          className="text-balance text-4xl font-medium text-gray-900"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {tier.id === "tier-pro"
                            ? tier.price[frequencyPro.value]
                            : tier.id === "tier-business"
                              ? tier.price[frequencyBusiness.value]
                              : tier.price[frequency.value]}
                        </span>
                        <span
                          className={cn(
                            "text-sm font-semibold leading-6 text-gray-600",
                            tier.id === "tier-enterprise" ? "hidden" : "",
                          )}
                        >
                          {tier.id === "tier-pro"
                            ? frequencyPro.priceSuffix
                            : tier.id === "tier-business"
                              ? frequencyBusiness.priceSuffix
                              : frequency.priceSuffix}
                        </span>
                      </p>
                      <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-muted-foreground text-balance">
                        {tier.description}
                      </p>
                      <ul
                        role="list"
                        className="mt-8 space-y-3 text-sm leading-6 text-gray-600 dark:text-muted-foreground"
                      >
                        <li>{tier.featureIntro}</li>
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex gap-x-3">
                            <CheckIcon
                              className="h-6 w-5 flex-none text-[#fb7a00]"
                              aria-hidden="true"
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="p-6">
                    {tier.id !== "tier-free" /** hide button on free tier */ ? (
                      tier.currentPlan ? (
                        <Button
                          className="rounded-3xl"
                          onClick={() => {
                            setClicked(true);
                            fetch(
                              `/api/teams/${teamInfo?.currentTeam?.id}/billing/manage`,
                              {
                                method: "POST",
                              },
                            )
                              .then(async (res) => {
                                const url = await res.json();
                                router.push(url);
                              })
                              .catch((err) => {
                                alert(err);
                                setClicked(false);
                              });
                          }}
                          loading={clicked}
                        >
                          Manage Subscription
                        </Button>
                      ) : plan !== "free" ? (
                        <Button
                          className="rounded-3xl"
                          variant={
                            tier.id === "tier-business" ? "orange" : "default"
                          }
                          onClick={() => {
                            setClicked(true);
                            fetch(
                              `/api/teams/${teamInfo?.currentTeam?.id}/billing/manage`,
                              {
                                method: "POST",
                              },
                            )
                              .then(async (res) => {
                                const url = await res.json();
                                router.push(url);
                              })
                              .catch((err) => {
                                alert(err);
                                setClicked(false);
                              });
                          }}
                          loading={clicked}
                        >
                          {tier.buttonText}
                        </Button>
                      ) : (
                        <UpgradePlanModal
                          clickedPlan={tier.name as "Pro" | "Business"}
                          trigger={"billing_page"}
                        >
                          <Button
                            className="rounded-3xl"
                            variant={
                              tier.id === "tier-business" ? "orange" : "default"
                            }
                          >
                            {tier.buttonText}
                          </Button>
                        </UpgradePlanModal>
                      )
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="isolate grid grid-cols-1 border border-black dark:border-muted-foreground rounded-xl overflow-hidden">
              <div
                key="tier-enterprise"
                className="border-black dark:border-muted-foreground border-r-0 md:border-r md:last:!border-r-0 flex flex-col justify-between"
              >
                <div>
                  <div className="border-b border-black dark:border-muted-foreground p-6 bg-gray-100 dark:bg-gray-800">
                    <h3
                      id="tier-enterprise"
                      className="text-balance text-foreground text-xl leading-8 flex items-center gap-x-2"
                    >
                      <span>Enterprise</span>
                    </h3>
                  </div>
                  <div className="p-6">
                    <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-muted-foreground text-balance">
                      Self-hosted and advanced document infrastructure for your
                      company.
                    </p>
                    <p className="mt-6 flex items-baseline gap-x-1">
                      <span className="text-balance text-4xl font-medium text-foreground">
                        Custom
                      </span>
                    </p>
                    <ul
                      role="list"
                      className="mt-8 text-sm leading-6 text-gray-600 dark:text-muted-foreground grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3"
                    >
                      {enterpriseFeatures.map((feature) => (
                        <li key={feature} className="flex gap-x-3">
                          <CheckIcon
                            className="h-6 w-5 flex-none text-[#fb7a00]"
                            aria-hidden="true"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-6">
                  <Link
                    href="https://cal.com/marcseitz/papermark"
                    target="_blank"
                  >
                    <Button className="rounded-3xl">Talk to us</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
