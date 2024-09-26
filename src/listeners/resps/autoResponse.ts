import { getJSON } from "../../lib/data.js";

import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, container } from "@sapphire/framework";
import { Message } from "discord.js";
import { Polyfrost, SkyClient } from "../../const.js";
import * as v from "valibot";
import { isTicket } from "../../lib/ticket.js";
import { buildDeleteBtnRow } from "../../lib/builders.js";
import { isTruthy } from "remeda";

/** Sends an autoresponse for the commands and suggestions we have */
@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class UserEvent extends Listener<typeof Events.MessageCreate> {
  public override async run(message: Message<true>) {
    const { member, channel } = message;
    if (!member) return;
    if (message.author.bot) return;

    let canAutoResp =
      channel.id == SkyClient.channels.General ||
      channel.id == SkyClient.channels.SkyblockTalk ||
      channel.id == SkyClient.channels.Support ||
      channel.id == Polyfrost.channels.General ||
      channel.id == Polyfrost.channels.TestingChat ||
      channel.parentId == Polyfrost.forums.Suggestions ||
      isTicket(channel);
    if (member.roles.cache.has(SkyClient.roles.NoAuto)) canAutoResp = false;
    if (!canAutoResp) return;

    const responses = await findAutoresps(
      message.content,
      message.guildId == SkyClient.id,
    );
    if (responses.length > 3) return;

    await Promise.all(
      responses.map(async (resp) =>
        message.reply({
          content: resp.response,
          components: !resp.tag ? [buildDeleteBtnRow(message.author)] : [],
        }),
      ),
    );
  }
}

const AutoResp = v.object({
  triggers: v.optional(v.array(v.string())),
  skyclient: v.optional(v.boolean()),
  response: v.string(),
});
type AutoResp = v.InferOutput<typeof AutoResp>;
const AutoResps = v.array(AutoResp);

const Resp = v.object({
  response: v.string(),
  tag: v.boolean(),
});
type Resp = v.InferOutput<typeof Resp>;

export async function findAutoresps(message: string, isSkyClient: boolean) {
  let resps: AutoResp[];
  try {
    resps = v.parse(AutoResps, await getJSON("botautoresponse"));
  } catch (e) {
    container.logger.error("Failed to read botautoresponse.json!", e);
    return [];
  }
  return resps
    .map((option): Resp | undefined => {
      if (option.skyclient && !isSkyClient) return;
      if (option.triggers)
        for (const re of option.triggers) {
          const matcher = new RegExp(re, "is");
          if (matcher.test(message))
            return { response: option.response, tag: false };
        }
      return;
    })
    .filter(isTruthy);
}
