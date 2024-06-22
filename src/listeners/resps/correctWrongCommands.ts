import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
} from "discord.js";
import { Users } from "../../const.js";

/** Corrects incorrect commands */
@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class UserEvent extends Listener<typeof Events.MessageCreate> {
  public override run(message: Message<true>) {
    const content = message.content.toLowerCase();
    let reply = "";

    if (content.startsWith("sky mod")) reply = witty("/mod");
    if (content.startsWith("sky pack")) reply = witty("/pack");
    if (content.startsWith("sky discord")) reply = witty("/discord");
    if (content == "sky invalidate") reply = witty("/invalidate");
    if (content == "-help") reply = noExisto;
    if (content == "-pullrepo") reply = srs("/invalidate");
    if (content == "-repo") reply = srs("/update");

    if (content.startsWith("sky help")) reply = noExisto;
    if (content == "sky bump") reply = srs("/bump");
    if (content.startsWith("sky search")) reply = srs("/search");
    if (content.startsWith("-update")) reply = srs("/update");
    if (content.startsWith("-bupdate")) reply = srs("/update beta:true");
    if (content.startsWith("-mod")) reply = srs("/mod");
    if (content.startsWith("-pack")) reply = srs("/pack");

    if (message.author.id == Users.nacrt) reply = "fuck you " + reply;
    const delRow = new ActionRowBuilder<ButtonBuilder>();
    delRow.addComponents(
      new ButtonBuilder({
        style: ButtonStyle.Danger,
        customId: "deleteResp|" + message.author.id,
        label: "Delete",
        emoji: "🗑️",
      }),
    );
    return message.reply({
      content: reply,
      components: [delRow],
    });
  }
}

const noExisto = "this command no longer exists :(";
const witty = (cmd: string) =>
  `ha ha very funny\n(you meant to say \`${cmd}\`)`;
const srs = (cmd: string) => `it's \`${cmd}\` now`;
