import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, container } from "@sapphire/framework";
import {
  PartialGuildMember,
  GuildMember,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} from "discord.js";
import { SkyClient } from "../../const.js";
import { isTextBasedChannel } from "@sapphire/discord.js-utilities";

/** Tracks when people (un)boost */
@ApplyOptions<Listener.Options>({
  event: Events.GuildMemberUpdate,
})
export class UserEvent extends Listener<typeof Events.GuildMemberUpdate> {
  public override async run(
    oldUser: GuildMember | PartialGuildMember,
    user: GuildMember,
  ) {
    if (user.guild.id != SkyClient.id) return;

    const botLogs = user.client.channels.cache.get(SkyClient.channels.BotLogs);

    if (oldUser.premiumSince && !user.premiumSince) {
      container.logger.info("Boost stop", user.id);
      if (isTextBasedChannel(botLogs))
        await botLogs.send(
          `${user.id} (${user.user.username}) stopped boosting`,
        );
      await user.roles.remove(
        SkyClient.roles.GiveawayBypass,
        "User stopped boosting",
      );
    } else if (!oldUser.premiumSince && user.premiumSince) {
      container.logger.info("Boost start", user.id);
      if (isTextBasedChannel(botLogs))
        await botLogs.send(
          `${user.id} (${user.user.username}) started boosting`,
        );

      await user.roles.add(
        SkyClient.roles.GiveawayBypass,
        "User started boosting",
      );

      const general = await user.client.channels.fetch(
        SkyClient.channels.General,
      );
      if (!isTextBasedChannel(general)) return;

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
