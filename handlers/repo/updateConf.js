import { InteractionType } from "discord.js";
import { activeUpdates, sendNewMod } from "./update.js";

/**
 * @param {import("discord.js").MessageComponentInteraction} interaction
 */
export const command = async (interaction) => {
  if (!interaction.inCachedGuild()) return;
  const trigger = await interaction.message.fetchReference();
  if (interaction.member.id != trigger.member.id) {
    return await interaction.reply({
      content: "why do you think you can do this?",
      ephemeral: true,
    });
  }
  await interaction.update({
    content: "pushing out update...",
    components: [],
  });

  const source = interaction.message.id;
  const modData = activeUpdates[source];
  await sendNewMod(modData);
  await interaction.editReply(
    `updated ${modData.forge_id} to ${modData.file} :D`
  );
};
export const when = {
  interactionId: "confirmModUpdate",
  interactionType: InteractionType.MessageComponent,
};
