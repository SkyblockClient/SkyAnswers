import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import {
  getDistance,
  getDownloadableMessage,
  getPacks,
  probableMatches,
  queryData,
} from "../../lib/data.js";
import { ApplicationCommandOptionType } from "discord.js";

@ApplyOptions<Command.Options>({
  description: "Gives info about a pack",
})
export class UserCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "pack",
          description: "Pack to search for",
          required: true,
          autocomplete: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "instructions",
          description: "Additional instructions to post with the mod",
          required: false,
          choices: [{ name: "Download Pack", value: "download" }],
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
    const query = interaction.options.getString("pack", true);
    const items = await getPacks();
    const item = queryData(items, query);
    if (!item) {
      const bestOption = probableMatches(items, query)[0];
      const bestDistance = getDistance(bestOption, query);
      return interaction.reply(
        "No pack found" +
          (bestDistance <= 3 ? `, did you mean "${bestOption.id}"?` : ""),
      );
    }
    const ping = interaction.options.getUser("mention", false);
    const instructions = interaction.options.getString("instructions", false);

    const pingText = ping?.toString() || "";
    let instText = "";
    switch (instructions) {
      case "download":
        instText = `Download ${item.display} below and add it to your \`resourcepacks\` folder.`;
    }

    const reply = await getDownloadableMessage(item);
    reply.content = `${pingText} ${instText}`;
    reply.allowedMentions = { users: ping ? [ping.id] : [] };
    return interaction.reply(reply);
  }
}
