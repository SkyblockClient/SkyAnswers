import { ChannelType, InteractionType } from "discord.js";
import { setTicketOpen } from "./start.js";
import { searchEmbed } from "../../data.js";

/**
 * @param {import("discord.js").ModalSubmitInteraction} interaction
 */
export const command = async (interaction) => {
  if (interaction.channel.type != ChannelType.GuildText) return;
  const origContent = interaction.message.content;
  const question = interaction.fields.getTextInputValue("problem");
  await interaction.deferUpdate();
  await interaction.editReply({
    ...(await searchEmbed(question)),
    content: `${origContent.split("\n")[0]}
**Problem**: ${question}`,
    components: [],
  });
  await setTicketOpen(interaction.channel, true);
};
export const when = {
  interactionId: "ticketSearchModal",
  interactionType: InteractionType.ModalSubmit,
};
