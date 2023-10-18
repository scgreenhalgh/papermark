import { NextApiResponse } from "next";

export class TeamError extends Error {
  statusCode = 400;
  constructor(public message: string) {
    super(message);
  }
}

export function errorHanlder(err: unknown, res: NextApiResponse) {
  if (err instanceof TeamError) {
    return res.status(err.statusCode).end(err.message);
  } else {
    return res.status(500).json({
      message: "Internal Server Error",
      error: (err as Error).message,
    });
  }
}
