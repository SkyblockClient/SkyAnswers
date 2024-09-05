import { Message, escapeMarkdown, unorderedList } from "discord.js";
import { Polyfrost, SkyClient } from "../../const.js";
import { Events, Listener, container } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import {
  isGuildBasedChannel,
  isTextChannel,
} from "@sapphire/discord.js-utilities";
import { isTicket } from "../../lib/ticket.js";

const streaks: Record<string, string[]> = {};
const ignoredChannels = [
  // Polyfrost
  "1053827347469570158", // #bot-land
  "1057847561597239336", // #counting
  "984850370834620416", //  #testers-chat

  // SkyClient
  "796546551878516766", //  #bot-commands
  "1135190905373081650", // #the-void
  SkyClient.channels.Trolling,
];

/** Flags users who are spamming for giveaways */
@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class MessageListener extends Listener<typeof Events.MessageCreate> {
  public override async run(message: Message) {
    const { author, guild, content, channel, client } = message;
    if (author.bot || !guild) return;
    const member = guild.members.cache.get(author.id);
    if (!member) return;

    const isSkyClient = guild.id == SkyClient.id;
    const isPolyfrost = guild.id == Polyfrost.id;

    if (!isSkyClient && !isPolyfrost) return;
    if (!isGuildBasedChannel(channel)) return;
    if (isTicket(channel)) return;

    const noGiveawaysRole = isSkyClient
      ? SkyClient.roles.NoGiveaways
      : Polyfrost.roles.NoGiveaways;
    const botLogsChannel = isSkyClient
      ? SkyClient.channels.BotLogs
      : Polyfrost.channels.BotLogs;
    const roles = member.roles.cache;

    if (ignoredChannels.includes(channel.id)) return;
    if (roles.has(SkyClient.roles.CoolPeople)) return; // cool people
    if (roles.has(noGiveawaysRole)) return; // already has no giveaways

    let streak = streaks[author.id];
    if (!streak) {
      streak = [];
      streaks[author.id] = streak;
    }

    const words = content.match(/[\w'`´]+/g);
    const isShort = !words || words.length < 3;
    if (isShort) streak.push(content);
    else streak.length = 0;

    if (streak.length != 6) return;

    try {
      await member.roles.add(noGiveawaysRole);

      const message = `${member.toString()} (${member.id}) has been blocked from giveaways
				**Reason:** 6 low effort messages in a row`;
      await channel.send(message);

      const botLogs = client.channels.cache.get(botLogsChannel);
      if (!isTextChannel(botLogs)) return;

      const list = unorderedList(streak.map((v) => escapeMarkdown(v)));
      await botLogs.send({
        content: `${message}\n${list}`,
        allowedMentions: { parse: [] },
      });
    } catch (e) {
      container.logger.error(e);
    }
  }
}
