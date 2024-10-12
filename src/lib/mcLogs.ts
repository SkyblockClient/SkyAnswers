import { FetchResultTypes, fetch } from "@sapphire/fetch";
import { Time } from "@sapphire/time-utilities";
import memoize from "memoize";
import * as v from "valibot";

const baseURL = "https://api.mclo.gs/1";
export const maxSize = 10_485_760;

const APIError = v.object({
  success: v.literal(false),
  error: v.string(),
});
type APIError = v.InferOutput<typeof APIError>;

const PostLog = v.object({
  success: v.literal(true),
  id: v.string(),
});
type PostLog = v.InferInput<typeof PostLog>;

const PostLogRes = v.variant("success", [PostLog, APIError]);
type PostLogRes = PostLog | APIError;

type LogType = { id: string };

export class Log {
  readonly id: string;
  constructor(id: string | LogType) {
    this.id = getMCLogID(id);
  }

  get url() {
    return `https://mclo.gs/${this.id}`;
  }

  get raw() {
    return `${baseURL}/raw/${this.id}`;
  }

  getRaw() {
    return getRawLog(this.id);
  }
  getInsights() {
    return getLogInsights(this.id);
  }
}

export async function postLog(text: string): Promise<Log> {
  const params = new URLSearchParams({ content: text.substring(0, maxSize) });
  const data = await fetch(`${baseURL}/log`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const res = v.parse(PostLogRes, data);
  if (!res.success) throw new Error(res.error);
  return new Log(res);
}

const getMCLogID = (log: string | LogType) =>
  encodeURIComponent(
    typeof log == "string" ? log.split("/").pop() || "" : log.id,
  );

async function _getRawLog(log: string | LogType): Promise<string> {
  const id = getMCLogID(log);
  return fetch(`${baseURL}/raw/${id}`, FetchResultTypes.Text);
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

async function _getLogInsights(log: string | LogType) {
  const id = getMCLogID(log);
  const data = await fetch(`${baseURL}/insights/${id}`);
  return v.parse(LogInsights, data);
}
export const getLogInsights = memoize(_getLogInsights, {
  cacheKey: ([log]) => getMCLogID(log),
  maxAge: Time.Hour,
});
