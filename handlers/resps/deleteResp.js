import { InteractionType } from "discord.js";

/**
 * @param {import("discord.js").Interaction} interaction
 */
export const command = async (interaction) => {
  const respondedTo = interaction.customId.split("|")[1];
  if (
    respondedTo != interaction.member.id &&
    !interaction.member.permissions.has("ManageMessages")
  ) {
    return await interaction.reply({ content: "not your autoresponse", ephemeral: true });
  }
  try {
    await interaction.message.delete();
  } catch (e) {
    console.log("could not delete", interaction.message);
  }
};
export const when = {
  interactionId: "deleteResp",
  interactionType: InteractionType.MessageComponent,
};
