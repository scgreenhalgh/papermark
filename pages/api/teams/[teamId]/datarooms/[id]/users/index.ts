import { getServerSession } from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { errorhandler } from "@/lib/errorHandler";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { sendViewerInvitation } from "@/lib/api/notification-helper";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/datarooms/:id/users
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauhorized");
    }

    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    const { emails } = req.body as { emails: string[] };

    if (!emails) {
      return res.status(400).json("Email is missing in request body");
    }

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: (session.user as CustomUser).id,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!team) {
        return res.status(403).end("Unauthorized to access this team");
      }

      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: teamId,
        },
        include: {
          viewers: true,
          links: true,
        },
      });

      if (!dataroom) {
        return res.status(404).end("Dataroom not found");
      }

      await prisma.viewer.createMany({
        data: emails.map((email) => ({
          email,
          dataroomId,
          invitedAt: new Date(),
        })),
        skipDuplicates: true,
      });

      const viewers = await prisma.viewer.findMany({
        where: {
          dataroomId,
          email: {
            in: emails,
          },
        },
        select: {
          id: true,
          email: true,
        },
      });

      // get linkId from first available dataroom link
      const linkId = dataroom.links[0].id;

      console.time("sendemail");
      await sendViewerInvitation({
        dataroomId,
        linkId,
        viewerIds: viewers.map((v) => v.id),
        senderUserId: (session.user as CustomUser).id,
      });
      console.timeEnd("sendemail");

      return res.status(200).json("Invitation sent!");
    } catch (error) {
      errorhandler(error, res);
    }
  }
}
