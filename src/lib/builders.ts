import {
  APIActionRowComponent,
  APIButtonComponent,
  ButtonStyle,
  ComponentType,
  GuildMember,
  User,
} from "discord.js";

export function buildDeleteBtn(
  author?: User | GuildMember,
): APIButtonComponent {
  let custom_id = "deleteResp";
  if (author) custom_id += `|${author.id}`;
  return {
    type: ComponentType.Button,
    style: ButtonStyle.Danger,
    custom_id,
    label: "Delete",
    emoji: { name: "🗑️" },
  };
}

export function buildDeleteBtnRow(
  author?: User | GuildMember,
): APIActionRowComponent<APIButtonComponent> {
  return {
    type: ComponentType.ActionRow,
    components: [buildDeleteBtn(author)],
  };
}
