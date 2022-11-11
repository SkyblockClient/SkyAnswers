import { InteractionType } from "discord.js";

export const command = async (interaction) => {
  const recievedTime = Date.now();
  const message = await interaction.reply({
    content: "blazingly fast ⚡",
    fetchReply: true,
    ephemeral: true,
  });
  const ping = interaction.client.ws.ping;
  const recieveTime = recievedTime - interaction.createdTimestamp;
  const sendTime = message.createdTimestamp - recievedTime;
  const totalTime = message.createdTimestamp - interaction.createdTimestamp;
  await interaction.editReply(
    `blazingly fast ⚡
ws ping: ${ping}ms
from interaction created to interaction recieved: ${recieveTime}ms
from interaction received to message created: ${sendTime}ms
total: ${totalTime}ms`
  );
};
export const when = {
  interactionId: "speed",
  interactionType: InteractionType.ApplicationCommand,
  slash: {
    data: {
      name: "speed",
      description: "gets a measure of speed",
    },
  },
};
