import { ApplyOptions } from "@sapphire/decorators";
import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import type { ButtonInteraction } from "discord.js";
import { isTicket, plsBePatientTY, setTicketOpen } from "../../lib/ticket.js";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class ButtonHandler extends InteractionHandler {
  public async run(interaction: ButtonInteraction) {
    const { channel } = interaction;
    if (!isTicket(channel)) return;

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
      components: [], // components stay behind without this
    });

    await setTicketOpen(channel, true);
    switch (crashType) {
      case "CP":
        return channel.send(
          `Please follow these instructions from the CrashPatch screen:
1. **Click the copy icon on the right side and paste the results here.**
2. ${plsBePatientTY}`,
        );
      case "launcher":
        return channel.send(`You'll need to send your crash log. Please follow these instructions:
1. Open your SkyClient folder. If you use the vanilla launcher, see this: https://youtu.be/BHIM2htfMk8
2. - **If you saw a "View Crash Report" button in the launcher:**
     Go to the \`crash-reports\` folder and upload the most recent file here.
   - **If you didn't see the button:**
     Go to the \`logs\` folder and upload the file called \`latest\` or \`latest.log\`.
   - **If you use Prism, Modrinth (app) or another non-vanilla launcher:***
     Click the \`Folder\` button in your launcher and open the \`logs\` folder.
     Then upload the \`fml-client-latest\` file here.
3. ${plsBePatientTY}`);
      case "other":
        return channel.send(
          `1. Please describe your crash so we can help you.\n2. ${plsBePatientTY}`,
        );
    }
    return;
  }

  public override parse(interaction: ButtonInteraction) {
    if (!interaction.customId.startsWith("ticketCategorizeCrash|"))
      return this.none();
    return this.some();
  }
}
