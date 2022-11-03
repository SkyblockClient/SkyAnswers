import { InteractionType } from "discord.js";
import { setTicketOpen } from "./start";

export const command = async (interaction) => {
  const origContent = interaction.message.content;
  const crashType = interaction.customId.split("|")[1];
  const crashTypeName = {
    CP: "CrashPatch",
    launcher: "Launcher",
    other: "Other",
  }[crashType];
  await interaction.update({
    content: `${origContent.split("\n")[0]}
**Crash type**: ${crashTypeName}`,
    components: [],
  });

  switch (crashType) {
    case "CP":
      await interaction.channel.send(
        '**Click the button that says "Copy crash report" and paste it here.**'
      );
      break;
    case "launcher":
      await interaction.channel
        .send(`1. Open your SkyClient folder. See this: https://youtu.be/BHIM2htfMk8
2.
**If you see a "View Crash Report" button:**
Go to the \`crash-reports\` folder and upload the most recent file here.
**If you don't:**
Go to the \`logs\` folder and upload the file called \`latest.log\`.`);
      break;
    case "other":
      await interaction.channel.send("Describe how you crashed so we can help you.");
      break;
  }
  await setTicketOpen(interaction.channel, true);
};
export const when = {
  interactionId: "ticketCategorizeCrash",
  interactionType: InteractionType.MessageComponent,
};
