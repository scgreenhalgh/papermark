import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/links/domains/:domain/:slug
    const { domain, slug } = req.query as { domain: string; slug: string };

    try {
      const link = await prisma.link.findUnique({
        where: {
          domainSlug_slug: {
            slug: slug,
            domainSlug: domain,
          },
        },
        select: {
          id: true,
          expiresAt: true,
          emailProtected: true,
          allowDownload: true,
          password: true,
          document: { select: { id: true, team: {select: { plan: true } } }  },
        },
      });

      console.log("plan", link);

      if (!link || !link.document.team) {
        return res.status(404).json({ error: "Link not found", message: `no link found, team ${link?.document.team}` });
      }


      console.log("plan", link.document.team.plan)

      // if owner of document is on free plan, return 404
      if (link.document.team.plan === "free") {
        return res.status(404).json({ error: "Link not found", message: `link found, team ${link.document.team.plan}` });
      }

      res.status(200).json(link);
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
