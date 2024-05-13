import { Metadata } from "next";
import Dashboard from "./ClientPage";
import Stats from "@/components/investors/stats";
import InvestorTable from "@/components/investors/table";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

export const revalidate = 3600; // revalidate the data at most every 24 hours

const data = {
  description:
    "List of 100 open-source investors. Open-source VC, open-source angel investors, created and powered by Papermark",
  title: "Open Source Investors | Papermark",
  url: "/open-source-investors",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.papermark.io"),
  title: data.title,
  description: data.description,
  openGraph: {
    title: data.title,
    description: data.description,
    url: data.url,
    siteName: "Papermark",
    images: [
      {
        url: "/_static/meta-image.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: data.title,
    description: data.description,
    creator: "@papermarkio",
    images: ["/_static/meta-image.png"],
  },
};

export type Investor = {
  id: string;
  createdTime: string;
  fields: Fields;
};

export type Fields = {
  name: string;
  type: string;
  title: string;
  company: string;
  twitterUrl: string;
  websiteUrl: string;
  twitterImageUrl: string;
  openSourceInvestments: string;
  checkSize: "Unknown" | "$5k - $50k" | "$50k+" | "$100k+" | "$250k+";
};

const getInvestors = async () => {
  const response = await fetch(
    "https://api.airtable.com/v0/appAxYMTCbZ1hGTmg/tblvBs5aqTt8qkb6h?fields%5B%5D=name&fields%5B%5D=title&fields%5B%5D=company&fields%5B%5D=checkSize&fields%5B%5D=openSourceInvestments&fields%5B%5D=twitterUrl&fields%5B%5D=websiteUrl&fields%5B%5D=twitterImageUrl&filterByFormula=AND(%7Bpublished%7D%3D1%2C%7Btype%7D%3D%22Angel%22)",
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error("Network response was not ok " + response.statusText);
  }
  const data = await response.json();
  return data;
};

const checkSizes = [
  { id: "7", label: "All" },
  { id: "1", label: "$5k - $50k" },
  { id: "2", label: "$50k+" },
  { id: "3", label: "$100k+" },
  { id: "4", label: "$250k+" },
];

const InvestorFallback = ({ allInvestors }: { allInvestors: Investor[] }) => {
  const category = "7";
  return (
    <>
      <Stats angelsLength={allInvestors.length} />
      <div className="sm:flex flex-col md:flex-row justify-between mt-4">
        <span className="isolate mt-5 inline-flex rounded-md shadow-sm w-fit">
          {checkSizes.map((checkSize) => (
            <Link
              href={
                checkSize.id !== "7"
                  ? `/open-source-investors/?category=${checkSize.id}`
                  : "/open-source-investors"
              }
              key={checkSize.id}
              className={cn(
                category === checkSize.id || (!category && checkSize.id === "7")
                  ? "bg-gray-200"
                  : "bg-white hover:bg-gray-50",
                "relative inline-flex items-center first-of-type:rounded-l-md last-of-type:rounded-r-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 focus:z-10 focus:outline-none focus:ring-gray-500 -ml-px first-of-type:-ml-0",
              )}
            >
              {checkSize.label}
            </Link>
          ))}
        </span>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle px-6 lg:px-8">
            <div className="overflow-hidden md:shadow md:ring-1 md:ring-black md:ring-opacity-5 rounded-lg">
              <InvestorTable investors={allInvestors} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default async function HomePage() {
  const data = await getInvestors();
  const { records: allInvestors } = data as { records: Investor[] };

  return (
    <>
      <div className="mx-auto max-w-6xl pt-4 mb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 sm:pt-16 pt-8 text-gray-600">
          <div className="space-y-5 max-w-4xl mx-auto text-center">
            <h1 className="text-3xl text-gray-800 font-extrabold mx-auto sm:text-6xl max-w-3xl tracking-tighter">
              Find the next angel investor for your open-source project
            </h1>
          </div>
        </div>
        <Suspense fallback={<InvestorFallback allInvestors={allInvestors} />}>
          <Dashboard data={data} />
        </Suspense>
      </div>
    </>
  );
}
