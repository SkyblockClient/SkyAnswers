import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import {
  TextChannel,
  PartialGuildMember,
  GuildMember,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} from "discord.js";
import { Channels, Roles, Servers } from "../../const.js";

/** Tracks when people (un)boost */
@ApplyOptions<Listener.Options>({
  event: Events.GuildMemberUpdate,
})
export class UserEvent extends Listener<typeof Events.GuildMemberUpdate> {
  public override async run(
    oldUser: GuildMember | PartialGuildMember,
    user: GuildMember,
  ) {
    if (user.guild.id != Servers.SkyClient) return;

    const verboseBotLogs = user.client.channels.cache.get(Channels.BotLogs);
    if (!(verboseBotLogs instanceof TextChannel)) return;

    if (oldUser.premiumSince && !user.premiumSince) {
      console.log("Boost stop", user.id);
      await verboseBotLogs.send(
        `${user.id} (${user.user.username}) stopped boosting`,
      );
      await user.roles.remove(Roles.GiveawayBypass, "User stopped boosting");
    } else if (!oldUser.premiumSince && user.premiumSince) {
      console.log("Boost start", user.id);
      await verboseBotLogs.send(
        `${user.id} (${user.user.username}) started boosting`,
      );

      await user.roles.add(Roles.GiveawayBypass, "User started boosting");

      const general = await user.client.channels.fetch(Channels.General);
      if (!general?.isTextBased()) return;

      const compRow = new ActionRowBuilder<ButtonBuilder>();
      compRow.addComponents(
        new ButtonBuilder({
          style: ButtonStyle.Primary,
          label: "Claim Rank",
          customId: "claimboost",
        }),
      );
      return general.send({
        content: `${user} **Thank you for boosting!!!** <3
Claim your in-game rank with the \`/claimboost\` command`,
        allowedMentions: { users: [user.id] },
        // components: [compRow] // TODO
      });
    }
    return;
  }
}
