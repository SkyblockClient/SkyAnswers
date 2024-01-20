import { ButtonStyle, ComponentType, InteractionType } from "discord.js";
import { pendingUpdates } from "./_update.js";

/**
 * @param {import("discord.js").MessageComponentInteraction} interaction
 */
export const command = async (interaction) => {
  const data = pendingUpdates[interaction.message.id];
  if (!data) {
    await interaction.reply({
      content: "no update found",
      ephemeral: true,
    });
    return;
  }
  if (data.initiator != interaction.user.id) {
    await interaction.reply({
      content: "not your update",
      ephemeral: true,
    });
    return;
  }

  await interaction.update({
    content: `first, double-check that this mod doesn't have a rat in it.
(rat-to-peer may take a bit to boot up but it'll load within 15 seconds)`,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            url: `https://ktibow.github.io/RatRater2/?rat-to-peer-url=${encodeURIComponent(
              data.url
            )}`,
            label: "RatRater",
            style: ButtonStyle.Link,
          },
          {
            type: ComponentType.Button,
            customId: "updateCheck2",
            label: "It's safe, I checked",
            style: ButtonStyle.Success,
          },
        ],
      },
    ],
  });
};
export const when = {
  interactionId: "updateCheck1",
  interactionType: InteractionType.MessageComponent,
};
