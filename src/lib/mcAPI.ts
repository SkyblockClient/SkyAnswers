import { fetch } from "@sapphire/fetch";
import * as v from "valibot";

const MCUsername = v.pipe(
  v.string(),
  v.minLength(3),
  v.maxLength(25),
  v.regex(/^\w+$/i),
);
const MCProfile = v.object({
  id: v.pipe(v.string(), v.length(32)),
  name: MCUsername,
});
type MCProfile = v.InferOutput<typeof MCProfile>;

export async function getMCProfile(mcName: string): Promise<MCProfile | null> {
  try {
    v.parse(MCUsername, mcName);
    const url = `https://api.mojang.com/users/profiles/minecraft/${mcName}`;
    return v.parse(MCProfile, await fetch(url));
  } catch (e) {
    if (e instanceof v.ValiError) return null;
    throw e;
  }
}

export const getMCName = async (mcName: string): Promise<string | undefined> =>
  (await getMCProfile(mcName))?.id;
