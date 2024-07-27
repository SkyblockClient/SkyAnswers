import { ApplyOptions } from "@sapphire/decorators";
import { Command, container } from "@sapphire/framework";
import { ApplicationCommandOptionType } from "discord.js";
import { SkyClient } from "../const.js";
import { getMCProfile } from "../lib/mcAPI.js";
import { BoostersDB } from "../lib/db.js";
import dedent from "dedent";

@ApplyOptions<Command.Options>({
  description: "Claims your in-game rank for boosting",
})
export class UserCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "username",
          description: "Minecraft Username",
          required: true,
        },
      ],
    });
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    if (interaction.guildId != SkyClient.id) return;

    const member = interaction.guild?.members.resolve(interaction.user);
    if (!member) return;
    const hasNitro = !!member.premiumSince;

    const mcName = interaction.options.getString("username", true);
    const profile = await getMCProfile(mcName);
    if (!profile)
      return interaction.reply({
        content:
          "Couldn't find this Minecraft account. Did you type it correctly?",
        ephemeral: true,
      });

    await BoostersDB.update((data) => {
      data[interaction.user.id] = profile.id;
    });
    container.logger.info(
      "Saving Booster",
      hasNitro,
      interaction.user.id,
      profile.id,
    );
    if (hasNitro)
      return interaction.reply({
        content: dedent`
          # Thanks for the boost! <3
          Your in-game rank will be applied to ${profile.name} in 5-10 minutes.
          -# [SkyClient Cosmetics](<https://modrinth.com/mod/scc>) is required to see the rank.
          -# If you don't see it, you may have to type \`/scc reload\` in game.
        `,
        ephemeral: true,
      });
    else
      return interaction.reply({
        content: dedent`
          **You don't appear to be Server Boosting.**
          Give us a boost to receive an in-game role with SkyClient Cosmetics!
        `,
        ephemeral: true,
      });
  }
}
