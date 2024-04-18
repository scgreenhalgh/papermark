import Head from "next/head";
import { useState } from "react";
import Feature from "@/components/web/alternatives/feature";
import FeaturesTable from "@/components/web/alternatives/featurestable";
import PricingTable from "@/components/web/alternatives/pricingtable";
import UseCaseTable from "@/components/web/alternatives/usecasetable";
import Article from "@/components/web/alternatives/docsendtext";
import Grid from "@/components/web/alternatives/alternativesgrid";
import Testimonials from "@/components/web/testimonials";
import CTA from "@/components/web/cta";
import Footer from "@/components/web/footer";
import Navbar from "@/components/web/navbar";
import { PlanSelect } from "@/components/web/alternatives/plan";
import { UsecaseSelect } from "@/components/web/alternatives/usecase";
import LoadingDots from "@/components/ui/loading-dots";

const features = [
  "send unlimited documents",
  "email capture",
  "analytics on each page",
  "custom domain",
  "team access",
  "large files upload",
];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [optimizedPost, setOptimizedPost] = useState<string>("");
  const [usecase, setUsecase] = useState<string>("");
  const [plan, setPlan] = useState<string>("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const shouldRenderSteps = () => {
    return selectedFeatures.length > 0;
  };

  const handlePrompt = () => {
    // Getting the list of selected features
    let priorityFeaturesList = selectedFeatures.join(", ");

    // Getting the list of features that were not selected
    let otherFeaturesList = features
      .filter((feature) => !selectedFeatures.includes(feature))
      .join(", ");

    let prompt = `Provide me the list of 4 best fitting Docsend alternatives, based on the requested plan: ${
      plan ? plan : "Free"
    }.}, and use case: ${usecase ? usecase : "Pitch Deck"}.
    It should be platforms which allow to share/send documents, turn document into a shareable link.
    The first one should be Papermark- it fits in every case and has all features in it. After papermark show most relevant, the one which have ${
      priorityFeaturesList ? priorityFeaturesList : "the requested features"
    }.
  Provide name. 
  On the next line word: Price: and price for this tool. Papermark price: start for free  
  
  Next should be word Features: and show list of ${
    priorityFeaturesList ? priorityFeaturesList : "the selected features"
  }. Near each feature, indicate with a yes/no whether it is available or not for this tool. 

  Also list ${otherFeaturesList} and near each indicate with a yes/no whether it is available or not for this tool. 

  Show all features in the list: Feature Name, and in brackets yes or no.

  Next show the text "Use case:"  ${usecase}  
  after In brackets say, if it fits for this case. If these use case is not widely used, say not widely used

  Next show the text "Plan:" ${plan}
  After In brackets says, if it availabe in this tool, mention selected planç

  Below provide 1 sentences what mainly tool for and how it compare with Docsend documnt sharing platform. 
  It should be favourable for Papermark so after reading user is tend to try it, but do not lie about other tools features.
  
  Do not show Docsend, as you are finding the best alternatives to Docsen or DropBox. You can use some of the popular like Pandadoc, Notion, Google Drive,BriefLink, Pitch but alos others. If there are not enough alternatives, list fewer. 

  
  Add at the end always: 
Please note that the prices and availability of features may vary, and it is recommended to visit the respective websites of these alternatives for more accurate and up-to-date information.`;

    return prompt;
  };

  // function to send post to OpenAI and get response
  const optimizePost = async (e: any) => {
    e.preventDefault();
    setOptimizedPost("");
    setLoading(true);
    const prompt = handlePrompt();
    const response = await fetch("/api/optimize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      const formattedChunk = chunkValue.replace(/\n/g, "<br>");
      setOptimizedPost((prev) => prev + formattedChunk);
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>
          Top 10 Docsend Alternatives in 2024 | Find Your Best Match
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta
          name="description"
          content="Explore the best Docsend alternatives in 2024 tailored for your needs. Find the right document sharing and tracking solution personalized for your use case."
        />

        <meta
          property="og:description"
          content="Looking for Docsend alternatives? Discover best document sharing platforms that cater to your unique business requirements and enhance your operational efficiency."
        />
        <meta
          property="og:title"
          content="Best 10 Docsend Alternatives in 2024 Personalised for Your Business"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Explore Best Docsend Alternatives | Find Your Match"
        />
        <meta
          name="twitter:description"
          content="Uncover personalized Docsend alternatives for your business. Find the best document and pitch deck sharing platforms tailored to fit your specific needs."
        />
      </Head>
      <div className="flex flex-1 flex-col bg-white text-black">
        <Navbar />
        <main className="flex flex-col items-center w-full">
          <section className="pt-24 lg:pt-24 bg-white w-full">
            <div className="px-4 lg:px-2 w-full">
              <div className="max-w-7xl mx-auto px-4 md:px-8 w-full">
                <div className="w-full flex flex-col items-center">
                  <div className="pb-1">
                    <img
                      src="https://media.licdn.com/dms/image/C560BAQF0P4VJimYMZw/company-logo_200_200/0/1630615035618?e=1720656000&v=beta&t=gWnITXssNMEKBqbdPrGev6pbQf9iLywYEr404OFtKV0"
                      alt="App screenshot"
                      className="mx-auto"
                      width={100}
                      height={50}
                    />
                  </div>
                  <div className="prose prose-h2:mb-2 first:prose-h2:mt-0 prose-h2:mt-10 prose-headings:font-medium sm:max-w-screen-md sm:pr-2 md:pr-0 w-full text-center">
                    <h1 className="text-5xl font-bold text-black lg:text-7xl my-8">
                      Top 10 Docsend alternatives in 2024
                    </h1>

                    <p className="text-m my-4 tracking-tight text-gray-500 sm:text-xl">
                      Compare best Docsend alternatives for sharing documents
                      and creating data room.
                    </p>
                  </div>
                </div>
                <FeaturesTable />
              </div>
            </div>

            <Article />

            <PricingTable />
            <UseCaseTable />
            <Grid />
            <div className="max-w-5xl mx-auto px-8 lg:px-28">
              <div className="max-w-5xl mx-auto">
                <div className="w-full my-1 mx-auto "></div>
                <h2 className="text-4xl font-bold text-black  my-8 text-center">
                  Find Docsend alterntive based on your requirements
                </h2>
                <p className="text-1xl mt-3 mb-5 text-center text-black font-semibold ">
                  Step 1. Select features you prioritize the most <br />
                </p>
                <Feature
                  selectedFeatures={selectedFeatures}
                  setSelectedFeatures={setSelectedFeatures}
                />

                <div className="w-full my-1 mx-auto">
                  <div className="flex space-x-4">
                    <div className="w-full">
                      {shouldRenderSteps() && (
                        <>
                          <p className="text-1xl mt-10 mb-5 text-center text-black font-semibold ">
                            Step 2. Select your plan
                            <br />
                          </p>
                          <div className="flex space-x-4">
                            {/* PlanSelect's width is decreased to half on larger screens using w-1/2 */}
                            <div className="w-full lg:w-1/2 mx-auto">
                              <PlanSelect plan={plan} setPlan={setPlan} />
                            </div>
                          </div>
                          <p className="text-1xl mt-10 mb-5 text-center text-black font-semibold ">
                            Step 3. Select your use case
                            <br />
                          </p>
                          <div className="w-full lg:w-1/2 mx-auto">
                            <UsecaseSelect
                              usecase={usecase}
                              setUsecase={setUsecase}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full my-1 mx-auto">
                  <div className="flex space-x-6"></div>
                </div>

                <div className="my-4 lg:px-72 ">
                  <button
                    disabled={loading}
                    onClick={(e) => optimizePost(e)}
                    className="bg-black font-medium rounded-md w-full text-white px-4 py-2 hover:bg-gray-900 disabled:bg-black"
                  >
                    {loading && <LoadingDots color="white" />}
                    {!loading && ` Find alternatives `}
                  </button>
                </div>
              </div>
              <div className="flex md:flex-col lg:flex-col">
                {optimizedPost && (
                  <div className="my-1">
                    <div className="flex justify-between items-center pb-2 py-2 border-gray-300">
                      <h2 className="text-xl font-bold text-white mx-auto">
                        Docsend alternatives just for you
                      </h2>
                    </div>

                    <div
                      className="max-w-2x bg-gray mx-auto text-black rounded-xl p-4 hover:bg-gray-100 transition cursor-copy border"
                      onClick={() => {
                        navigator.clipboard.write([
                          new ClipboardItem({
                            "text/html": new Blob([optimizedPost], {
                              type: "text/html",
                            }),
                          }),
                        ]);
                      }}
                      key={optimizedPost}
                    >
                      <p
                        className="text-black-700"
                        dangerouslySetInnerHTML={{
                          __html: optimizedPost,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="my-4 lg:px-80">
                {optimizedPost && (
                  <a
                    href="/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-200 text-xs rounded-md w-full text-white px-1 py-1 hover:bg-black disabled:bg-purple-500 inline-block text-center"
                  >
                    Send document
                  </a>
                )}
              </div>
            </div>

            <Testimonials />
            <CTA />
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
