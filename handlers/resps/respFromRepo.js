import { ButtonStyle, ComponentType } from "discord.js";
import { getTrackedData } from "../../data.js";
export const findAutoresps = async (message) => {
  const options = await getTrackedData(
    "https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/botautoresponse.json"
  );
  const matches = options
    .map((option) => {
      if (option.unclebot) return message == option.triggers[0][0] && option.response;

      const matcher = new RegExp(
        option.triggers
          .map((part) => {
            const escapeForGroup = (str) => str.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
            return `(?:${part.map((trig) => escapeForGroup(trig)).join("|")})`;
          })
          .join("[^]*"),
        "i"
      );
      if (matcher.test(message)) return option.response;
    })
    .filter((resp) => resp);
  return matches;
};
export const command = async (message) => {
  if (message.member.roles.cache.has("852016624605462589")) return;
  const responses = await findAutoresps(message.content);
  if (responses.length > 3) return;
  await Promise.all(
    responses.map((resp) =>
      message.reply({
        content: resp,
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                customId: "deleteResp|" + message.author.id,
                label: "Delete",
                style: ButtonStyle.Secondary,
              },
            ],
          },
        ],
        allowedMentions: { repliedUser: false },
      })
    )
  );
};
export const when = {
  all: "messages",
  desc: "Sends an autoresponse for the commands and suggestions we have",
};
