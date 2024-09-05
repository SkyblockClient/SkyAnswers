import { ApplyOptions } from "@sapphire/decorators";
import { isGuildMember, isTextChannel } from "@sapphire/discord.js-utilities";
import { Command, container } from "@sapphire/framework";
import { ApplicationCommandOptionType } from "discord.js";
import { Polyfrost, SkyClient } from "../const.ts";
import dedent from "dedent";

@ApplyOptions<Command.Options>({
  description: "Blacklist a user from giveaways",
  requiredUserPermissions: ["ManageRoles"],
  requiredClientPermissions: ["ManageRoles"],
})
export class UserCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: "user",
          description: "User to blacklist",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "reason",
          description: "Reason to log",
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: "silent",
          description: "Silent",
        },
      ],
    });
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const member = interaction.options.getMember("user");
    if (!isGuildMember(member)) return;

    const isSkyClient = interaction.guildId == SkyClient.id;
    const isPolyfrost = interaction.guildId == Polyfrost.id;
    if (!isSkyClient && !isPolyfrost) return;

    const noGiveawaysRole = isSkyClient
      ? SkyClient.roles.NoGiveaways
      : Polyfrost.roles.NoGiveaways;
    const botLogsChannel = isSkyClient
      ? SkyClient.channels.BotLogs
      : Polyfrost.channels.BotLogs;
    const roles = member.roles.cache;

    if (roles.has(noGiveawaysRole))
      return interaction.reply({
        content: "User is already blacklisted",
        ephemeral: true,
      });
    if (roles.has(SkyClient.roles.CoolPeople))
      return interaction.reply({
        content: "User is too cool 😎",
        ephemeral: true,
      });

    try {
      await member.roles.add(noGiveawaysRole);

      const reason = interaction.options.getString("reason");
      const reasonLine = reason
        ? `**Reason:** ${reason}`
        : "No reason provided";

      const message = dedent`
				${member.toString()} has been blocked from giveaways
				${reasonLine}
			`;
      await interaction.reply({
        content: message,
        ephemeral: !!interaction.options.getBoolean("silent"),
      });

      const botLogs = interaction.client.channels.cache.get(botLogsChannel);
      if (!isTextChannel(botLogs)) return;

      await botLogs.send({
        content: dedent`
					${message}
					**Moderator:** ${interaction.user.toString()} (${interaction.user.id})
				`,
        allowedMentions: { parse: [] },
      });
    } catch (e) {
      container.logger.error(e);
    }
    return;
  }
}
