import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import type { ButtonInteraction } from "discord.js";
import {
  ButtonStyle,
  ComponentType,
  roleMention,
  userMention,
} from "discord.js";
import { notSkyClient } from "../../preconditions/notPublic.js";
import { PendingUpdatesDB } from "../../lib/db.js";
import { isGuildBasedChannel } from "@sapphire/discord.js-utilities";
import { SkyClient } from "../../const.ts";
import dedent from "dedent";
import { getUpdatePerms } from "../../lib/update.ts";

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
      await PendingUpdatesDB.update((data) => {
        return (data[interaction.message.id] = {
          ...data[interaction.message.id],
          pingMsg: pingMsg.id,
        });
      });
    }

    return interaction.update({
      content: dedent`
        Double-check that this mod doesn't have a rat in it before approving!
        **(rat-to-peer may take a bit to boot up but it'll load within 15 seconds)**

        ${interaction.user.toString()} don't forget to approve your own update
      `,
      embeds: [
        interaction.message.embeds[0],
        {
          title: "Approvers",
          description: "None yet",
        },
      ],
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              url: `https://ktibow.github.io/RatRater2/?rat-to-peer-url=${encodeURIComponent(
                data.url,
              )}`,
              label: "RatRater",
              style: ButtonStyle.Link,
            },
            {
              type: ComponentType.Button,
              customId: "updateCheck2",
              label: "Approve",
              style: ButtonStyle.Success,
            },
          ],
        },
      ],
    });
  }

  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== "updateCheck1") return this.none();
    return this.some();
  }
}
