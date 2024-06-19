import { FetchResultTypes, fetch } from "@sapphire/fetch";
import pMemoize from "p-memoize";
import z from "zod";

const baseURL = "https://api.mclo.gs/1";

const APIError = z.object({
  success: z.literal(false),
  error: z.string(),
});
type APIError = z.infer<typeof APIError>;

const PostLog = z.object({
  success: z.literal(true),
  id: z.string(),
  url: z.string().url(),
  raw: z.string().url(),
});
type PostLog = z.input<typeof PostLog>;
const PostLogRes = z.discriminatedUnion("success", [PostLog, APIError]);
type PostLogRes = PostLog | APIError;

export type Log = Omit<PostLog, "success"> & {
  getRaw: () => Promise<string>;
  getInsights: () => Promise<LogInsights>;
};

export async function postLog(log: string): Promise<Log> {
  const params = new URLSearchParams({ content: log });
  const data = await fetch(`${baseURL}/log`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const res = PostLogRes.parse(data);
  if (!res.success) throw new Error(res.error);
  return getMCLog(res.id);
}

function isPostLog(res: unknown): res is PostLog {
  return PostLog.safeParse(res).success;
}

const getMCLogID = (log: string | PostLog) =>
  encodeURIComponent(isPostLog(log) ? log.id : log.split("/").pop() || "");
export function getMCLog(log: string | PostLog): Log {
  const id = getMCLogID(log);
  return {
    id,
    url: `https://mclo.gs/${id}`,
    raw: `https://api.mclo.gs/1/raw/${id}`,
    getRaw: () => getRawLog(id),
    getInsights: () => getLogInsights(id),
  };
}

export const getRawLog = pMemoize(
  async (log: string | PostLog): Promise<string> => {
    const id = getMCLogID(log);
    return await fetch(
      `https://api.mclo.gs/1/raw/${id}`,
      FetchResultTypes.Text,
    );
  },
  {
    cacheKey: ([log]) => getMCLogID(log),
  },
);

enum Level {
  EMERGENCY,
  ALERT,
  CRITICAL,
  ERROR,
  WARNING,
  NOTICE,
  INFO,
  DEBUG,
}

const EntryLevel = z.nativeEnum(Level);
type EntryLevel = z.infer<typeof EntryLevel>;
const EntryLine = z.object({
  number: z.number(),
  content: z.string().describe("The full content of the line."),
});
const AnalysisEntry = z.object({
  level: EntryLevel,
  time: z.null(),
  prefix: z
    .string()
    .describe(
      "The prefix of this entry, usually the part containing time and loglevel.",
    ),
  lines: z.array(EntryLine),
});

const LogInsights = z.object({
  id: z.string().describe("name/type"),
  name: z.string().describe("Software name, e.g. Vanilla").nullable(),
  type: z.string().describe("Type name, e.g. Server Log"),
  version: z.string().describe("Version, e.g. 1.12.2").nullable(),
  title: z.string().describe("Combined title, e.g. Vanilla 1.12.2 Server Log"),
  analysis: z.object({
    problems: z.array(
      z.object({
        message: z.string().describe("A message explaining the problem."),
        counter: z.number(),
        entry: AnalysisEntry,
        solutions: z.array(
          z.object({
            message: z
              .string()
              .describe("A message explaining a possible solution."),
          }),
        ),
      }),
    ),
    information: z.array(
      z.object({
        message: z.string().describe("Label: value"),
        counter: z.number(),
        label: z
          .string()
          .describe("The label of this information, e.g. Minecraft version"),
        value: z
          .string()
          .describe("The value of this information, e.g. 1.12.2"),
        entry: AnalysisEntry,
      }),
    ),
  }),
});
type LogInsights = z.infer<typeof LogInsights>;

export const getLogInsights = pMemoize(async (log: string | PostLog) => {
  const id = getMCLogID(log);
  const data = await fetch(
    `https://api.mclo.gs/1/insights/${encodeURIComponent(id)}`,
    FetchResultTypes.JSON,
  );
  return LogInsights.parse(data);
});
