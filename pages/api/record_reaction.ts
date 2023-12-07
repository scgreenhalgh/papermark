import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { checkPassword, log } from "@/lib/utils";
import { trackAnalytics } from "@/lib/analytics";
import { client } from "@/trigger";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  // POST /api/record_reaction

  const { viewId, pageNumber, type } = req.body as {
    viewId: string;
    pageNumber: number;
    type: string;
  };

  try {
    const reaction = await prisma.reaction.create({
      data: {
        viewId,
        pageNumber,
        type,
      },
    });

    if (!reaction) {
      res.status(500).json({ message: "Internal Server Error" });
      return;
    }

    res.status(200).json({ message: "Reaction recorded" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
}
