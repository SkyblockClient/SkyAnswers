import { InteractionType } from "discord.js";
import { sendNewMod } from "./update.js";

/**
 * @param {import("discord.js").ModalSubmitInteraction} interaction
 */
export const command = async (interaction) => {
  if (!interaction.isFromMessage()) return;
  const modData = Object.fromEntries(
    interaction.fields.fields.map((i) => [i.customId, i.value])
  );
  await interaction.update({
    content: "pushing out update...",
    components: [],
  });
  await sendNewMod(modData);
  await interaction.editReply(`updated ${modData.id} (custom settings) :D`);
};
export const when = {
  interactionId: "modalUpdate",
  interactionType: InteractionType.ModalSubmit,
};
