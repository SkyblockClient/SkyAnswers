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
    content: `next, get this approved by one of the mod developers or a github keeper.
(ping who you see fit.)`,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            customId: "updateCheck3",
            label: "I want to push out this mod",
            style: ButtonStyle.Success,
          },
        ],
      },
    ],
  });
};
export const when = {
  interactionId: "updateCheck2",
  interactionType: InteractionType.MessageComponent,
};
