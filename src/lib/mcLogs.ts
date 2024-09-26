import { FetchResultTypes, fetch } from "@sapphire/fetch";
import { Time } from "@sapphire/time-utilities";
import memoize from "memoize";
import * as v from "valibot";

const baseURL = "https://api.mclo.gs/1";

const URL = v.pipe(v.string(), v.url());

const APIError = v.object({
  success: v.literal(false),
  error: v.string(),
});
type APIError = v.InferOutput<typeof APIError>;

const PostLog = v.object({
  success: v.literal(true),
  id: v.string(),
  url: URL,
  raw: URL,
});
type PostLog = v.InferInput<typeof PostLog>;
const PostLogRes = v.variant("success", [PostLog, APIError]);
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
  const res = v.parse(PostLogRes, data);
  if (!res.success) throw new Error(res.error);
  return getMCLog(res.id);
}

function isPostLog(res: unknown): res is PostLog {
  return v.safeParse(PostLog, res).success;
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

async function _getRawLog(log: string | PostLog): Promise<string> {
  const id = getMCLogID(log);
  return fetch(`https://api.mclo.gs/1/raw/${id}`, FetchResultTypes.Text);
}
export const getRawLog = memoize(_getRawLog, {
  cacheKey: ([log]) => getMCLogID(log),
  maxAge: Time.Hour,
});

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

const EntryLevel = v.enum(Level);
type EntryLevel = v.InferOutput<typeof EntryLevel>;
const EntryLine = v.object({
  number: v.number(),
  content: v.pipe(v.string(), v.description("The full content of the line.")),
});
const AnalysisEntry = v.object({
  level: EntryLevel,
  time: v.null(),
  prefix: v.pipe(
    v.string(),
    v.description(
      "The prefix of this entry, usually the part containing time and loglevel.",
    ),
  ),
  lines: v.array(EntryLine),
});

const LogInsights = v.object({
  id: v.pipe(v.string(), v.description("name/type")),
  name: v.nullable(
    v.pipe(v.string(), v.description("Software name, e.g. Vanilla")),
  ),
  type: v.pipe(v.string(), v.description("Type name, e.g. Server Log")),
  version: v.nullable(
    v.pipe(v.string(), v.description("Version, e.g. 1.12.2")),
  ),
  title: v.pipe(
    v.string(),
    v.description("Combined title, e.g. Vanilla 1.12.2 Server Log"),
  ),
  analysis: v.object({
    problems: v.array(
      v.object({
        message: v.pipe(
          v.string(),
          v.description("A message explaining the problem."),
        ),
        counter: v.number(),
        entry: AnalysisEntry,
        solutions: v.array(
          v.object({
            message: v.pipe(
              v.string(),
              v.description("A message explaining a possible solution."),
            ),
          }),
        ),
      }),
    ),
    information: v.array(
      v.object({
        message: v.pipe(v.string(), v.description("Label: value")),
        counter: v.number(),
        label: v.pipe(
          v.string(),
          v.description(
            "The label of this information, e.g. Minecraft version",
          ),
        ),
        value: v.pipe(
          v.string(),
          v.description("The value of this information, e.g. 1.12.2"),
        ),
        entry: AnalysisEntry,
      }),
    ),
  }),
});
type LogInsights = v.InferOutput<typeof LogInsights>;

async function _getLogInsights(log: string | PostLog) {
  const id = getMCLogID(log);
  const data = await fetch(
    `https://api.mclo.gs/1/insights/${encodeURIComponent(id)}`,
    FetchResultTypes.JSON,
  );
  return v.parse(LogInsights, data);
}
export const getLogInsights = memoize(_getLogInsights, {
  cacheKey: ([log]) => getMCLogID(log),
  maxAge: Time.Hour,
});
