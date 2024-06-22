import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import {
  getDistance,
  getDownloadableMessage,
  getMods,
  probableMatches,
  queryData,
} from "../../lib/data.js";
import { ApplicationCommandOptionType } from "discord.js";

@ApplyOptions<Command.Options>({
  description: "Gives info about a mod",
})
export class UserCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "mod",
          description: "Mod to search for",
          required: true,
          autocomplete: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "instructions",
          description: "Additional instructions to post with the mod",
          required: false,
          choices: [
            { name: "Download Mod", value: "download" },
            { name: "Config Command", value: "config" },
          ],
        },
        {
          type: ApplicationCommandOptionType.User,
          name: "mention",
          description: "User to mention when posting the mod",
          required: false,
        },
      ],
    });
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const query = interaction.options.getString("mod", true);
    const items = await getMods();
    const item = queryData(items, query);
    if (!item) {
      const bestOption = probableMatches(items, query)[0];
      const bestDistance = getDistance(bestOption, query);
      return interaction.reply(
        "No mod found" +
          (bestDistance <= 3 ? `, did you mean "${bestOption.id}"?` : ""),
      );
    }
    let bundledIn: string | undefined;
    if (item.hidden) {
      bundledIn = items.find((otherItem) =>
        otherItem.packages?.includes(item.id),
      )?.display;
    }
    const ping = interaction.options.getUser("mention", false);
    const instructions = interaction.options.getString("instructions", false);

    const pingText = ping?.toString() || "";
    let instText = "";
    switch (instructions) {
      case "download":
        instText = `Download ${item.display} below and add it to your \`mods\` folder.`;
        break;
      case "config": {
        const { command } = item;
        if (!command)
          return interaction.reply({
            content: `${item.display} doesn't have a config command!`,
            ephemeral: true,
          });
        instText = `You can configure ${item.display} using the command \`${command}\` in-game.`;
      }
    }
    const reply = await getDownloadableMessage(item, bundledIn);
    reply.content = `${pingText} ${instText}`;
    reply.allowedMentions = { users: ping ? [ping.id] : [] };
    return interaction.reply(reply);
  }
}
