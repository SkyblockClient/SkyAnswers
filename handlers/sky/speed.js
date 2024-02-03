import { InteractionType } from "discord.js";

/**
 * @param {import("discord.js").CommandInteraction} interaction
 */
export const command = async (interaction) => {
  const recievedTime = Date.now();
  const message = await interaction.reply({
    content: "blazingly fast ⚡",
    fetchReply: true,
  });
  const ping = interaction.client.ws.ping;
  const recieveTime = recievedTime - interaction.createdTimestamp;
  const sendTime = message.createdTimestamp - recievedTime;
  const totalTime = message.createdTimestamp - interaction.createdTimestamp;
  await interaction.editReply(
    `blazingly fast ⚡
ws: ${ping}ms
this interaction: ${recieveTime}ms to recieve interaction, ${sendTime}ms to send message - total ${totalTime}ms`
  );
};
export const when = {
  interactionId: "speed",
  interactionType: InteractionType.ApplicationCommand,
  public: true,
  slash: {
    data: {
      name: "speed",
      description: "gets a measure of speed",
    },
  },
};
