import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import dedent from "dedent";
import {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { EmojiIDs } from "../../const.ts";

const windowsURL = "https://github.com/nacrt/SkyblockClient/releases/latest";
const javaURL =
  "https://github.com/koxx12-dev/Skyclient-installer-Java/releases/latest";
const martURL = "https://mart.skyclient.co/";

@ApplyOptions<Command.Options>({
  description: 'Generate "Download SkyClient" embed',
  requiredUserPermissions: ["Administrator"],
})
export class UserCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    return interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        new ContainerBuilder().setAccentColor(0x00a4ef).addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(dedent`
                ## Windows Installer
                - **Recommended**
                - Requires Windows 10 / 11
              `),
            )
            .setButtonAccessory(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setEmoji(EmojiIDs.Windows)
                .setLabel("Download")
                .setURL(windowsURL),
            ),
        ),
        new ContainerBuilder().setAccentColor(0xec2024).addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(dedent`
                ## Java Installer
                - Recommended for **Mac and Linux**
                - Works on Windows, Mac, and Linux
                - **Requires Java** to be installed
              `),
            )
            .setButtonAccessory(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setEmoji(EmojiIDs.Java)
                .setLabel("Download")
                .setURL(javaURL),
            ),
        ),
        new ContainerBuilder().setAccentColor(0x00ff00).addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(dedent`
                ## Web Installer (Mart)
                - Runs in your **web browser**
                - **No download required**
                - Recommended for **Steam Deck**
                - Does not work in some browsers, like Brave and Firefox
              `),
            )
            .setButtonAccessory(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setEmoji(EmojiIDs.Chrome)
                .setLabel("Open")
                .setURL(martURL),
            ),
        ),
      ],
    });
  }
}
