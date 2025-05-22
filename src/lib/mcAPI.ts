import { fetch } from "@sapphire/fetch";
import { z } from "zod/v4-mini";

const MCUsername = z
  .string()
  .check(z.minLength(3), z.maxLength(25), z.regex(/^\w+$/i));
const MCProfile = z.object({
  id: z.string().check(z.length(32)),
  name: MCUsername,
});
type MCProfile = z.infer<typeof MCProfile>;

export async function getMCProfile(mcName: string): Promise<MCProfile | null> {
  try {
    MCUsername.parse(mcName);
    const url = `https://api.mojang.com/users/profiles/minecraft/${mcName}`;
    return MCProfile.parse(await fetch(url));
  } catch (e) {
    if (e instanceof z.core.$ZodError) return null;
    throw e;
  }
}

export const getMCName = async (mcName: string): Promise<string | undefined> =>
  (await getMCProfile(mcName))?.id;
