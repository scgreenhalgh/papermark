import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { log } from "@/lib/utils";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/viewers
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };
    const userId = (session.user as CustomUser).id;

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
        select: {
          id: true,
          teamId: true,
          name: true,
          viewers: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              views: {
                where: {
                  viewType: "DATAROOM_VIEW",
                },
                orderBy: {
                  viewedAt: "desc",
                },
                include: {
                  link: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const users = await prisma.user.findMany({
        where: {
          teams: {
            some: {
              teamId: teamId,
            },
          },
        },
        select: {
          email: true,
        },
      });

      const viewers = dataroom?.viewers || [];

      const returnViews = viewers.map((viewer) => {
        return {
          ...viewer,
          dataroomName: dataroom?.name,
          lastViewedAt:
            viewer.views.length > 0 ? viewer.views[0].viewedAt : null,
          internal: users.some((user) => user.email === viewer.email), // set internal to true if view.viewerEmail is in the users list
        };
      });

      return res.status(200).json(returnViews);
    } catch (error) {
      log({
        message: `Failed to get views for dataroom: _${dataroomId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
