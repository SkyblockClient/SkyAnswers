import { ComponentType, InteractionType, TextInputStyle } from "discord.js";

export const command = async (interaction) => {
  await interaction.showModal({
    title: "Tell us your problem",
    customId: "ticketSearchModal",
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.TextInput,
            label: "Provide a description of your problem",
            customId: "problem",
            style: TextInputStyle.Short,
          },
        ],
      },
    ],
  });
};
export const when = {
  interactionId: "ticketSearch",
  interactionType: InteractionType.MessageComponent,
};
