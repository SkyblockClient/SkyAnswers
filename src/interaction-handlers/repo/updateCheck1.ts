import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import type { ButtonInteraction } from "discord.js";
import { roleMention, userMention } from "discord.js";
import { notSkyClient } from "../../preconditions/notPublic.js";
import { PendingUpdatesDB } from "../../lib/db.js";
import { isGuildBasedChannel } from "@sapphire/discord.js-utilities";
import { SkyClient } from "../../const.ts";
import { getUpdatePerms } from "../../lib/update.ts";
import { generateMessage } from "./updateCheck2.ts";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class ButtonHandler extends InteractionHandler {
  public async run(interaction: ButtonInteraction) {
    if (notSkyClient(interaction.guildId)) return;
    const { channel } = interaction;

    const pendingUpdates = PendingUpdatesDB.data;
    const data = pendingUpdates[interaction.message.id];
    if (!data)
      return interaction.reply({
        content: "no update found (this shouldn't happen)",
        ephemeral: true,
      });

    if (isGuildBasedChannel(channel)) {
      const url = `https://discord.com/channels/${channel.guildId}/${channel.id}/${interaction.message.id}`;
      const mentions: string[] = [];
      mentions.push(roleMention(SkyClient.roles.GitHubKeeper));

      const perms = await getUpdatePerms();
      for (const [userId, perm] of Object.entries(perms)) {
        const ids = (data.type == "mod" ? perm.mods : perm.packs) || {};
        if (Object.keys(ids).includes(data.id))
          mentions.push(userMention(userId));
      }

      const pingMsg = await channel.send(`${mentions.join(" ")} ${url}`);
      await PendingUpdatesDB.update(
        (data) =>
          (data[interaction.message.id] = {
            ...data[interaction.message.id],
            pingMsg: pingMsg.id,
          }),
      );
    }

    return interaction.update(generateMessage(interaction, data));
  }

  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== "updateCheck1") return this.none();
    return this.some();
  }
}
