import { InteractionType } from "discord.js";
import { activeUpdates, sendNewMod } from "./update.js";

export const command = async (interaction) => {
  if (
    !interaction.member.roles.cache.has("799020944487612428") &&
    !interaction.member.permissions.has("Administrator")
  ) {
    return await interaction.reply({
      content: "why do you think you can do this?",
      ephemeral: true,
    });
  }
  await interaction.update({ content: "pushing out update...", components: [] });

  const source = interaction.message.id;
  const modData = activeUpdates[source];
  await sendNewMod(modData);
  await interaction.message.edit(`updated ${modData.forge_id} :D`);
};
export const when = {
  interactionId: "confirmModUpdate",
  interactionType: InteractionType.MessageComponent,
};
