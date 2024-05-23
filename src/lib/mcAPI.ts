import { fetch } from "@sapphire/fetch";
import { ZodError, z } from "zod";

const MCUsername = z.string().min(3).max(16).regex(/^\w+$/i);
const MCProfile = z.object({
  id: z.string().length(32),
  name: MCUsername,
});
type MCProfile = z.infer<typeof MCProfile>;

export async function getMCProfile(
  mcName: string,
): Promise<MCProfile | undefined> {
  try {
    MCUsername.parse(mcName);
    const url = `https://api.mojang.com/users/profiles/minecraft/${mcName}`;
    return MCProfile.parse(await fetch(url));
  } catch (e) {
    if (e instanceof ZodError) return;
    throw e;
  }
}

export const getMCName = async (mcName: string): Promise<string | undefined> =>
  (await getMCProfile(mcName))?.id;
