import { ApplicationCommandType, InteractionType } from "discord.js";

/**
 * @param {import("discord.js").MessageContextMenuCommandInteraction} interaction
 */
export const command = async (interaction) => {
  interaction.reply({ content: "ratioing", ephemeral: true });
  const message = interaction.targetMessage;
  try {
    await message.react("👎");
    await Promise.all(
      [
        ":micro:970937864156221490",
        ":micro0:1084545760961499177",
        ":micro1:1084545758293917756",
        ":micro2:1084545756410683452",
        ":micro3:1084545753843761202",
        ":micro4:1084545751352356976",
        ":micro5:1084545748034666537",
        ":micro6:1084545746092699708",
        ":micro7:1084545743630643342",
        ":micro8:1084545740669452318",
        ":micro9:1084545738765238444",
        ":micro10:1084545735791484978",
        ":micro11:1084545733035835402",
        ":micro12:1084545730213060679",
        ":micro13:1084545727327391765",
        ":micro14:1084545725347668129",
        ":micro15:1084545723254702202",
        ":micro16:1084545720553582673",
        ":micro17:1084545717047144499",
      ].map(async (e) => {
        await message.react(e);
      })
    );
  } catch (e) {
    interaction.editReply({ content: "failed\n" + e });
  }
};
export const when = {
  interactionId: "Ratio",
  interactionType: InteractionType.ApplicationCommand,
  public: true,
  slash: {
    data: {
      name: "Ratio",
      type: ApplicationCommandType.Message,
    },
  },
};
