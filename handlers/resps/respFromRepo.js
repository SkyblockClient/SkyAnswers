import { ButtonStyle, ComponentType } from "discord.js";
import { getTrackedData } from "../../data.js";
export const findAutoresps = async (message, noAutoresponses) => {
  const options = await getTrackedData(
    "https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/botautoresponse.json"
  );
  const matches = options
    .map((option) => {
      const tags = typeof option.tag == "string" ? [option.tag] : option.tag;
      for (const tag of tags) {
        if (message.toLowerCase() == tag.toLowerCase())
          return { response: option.response, tag };
      }
      if (noAutoresponses) return;

      for (const re of options.triggers) {
        const matcher = new RegExp(re, "is");
        if (matcher.test(message))
          return { response: option.response, tag: undefined };
      }
    })
    .filter((resp) => resp);
  return matches;
};
export const command = async (message) => {
  let noAutoresponses = message.member.roles.cache.has("852016624605462589");
  if (
    message.channel.id != "780181693553704973" && // general
    message.channel.id != "1110717104757416027" && // skyblock talk
    message.channel.id != "1001798063964303390" && // support
    message.channel.id != "796546551878516766" && // bot commands
    !message.channel.name.startsWith("ticket-") &&
    message.guild.id != "962319226377474078"
  )
    noAutoresponses = true;
  const responses = await findAutoresps(message.content, noAutoresponses);
  if (responses.length > 3) return;

  await Promise.all(
    responses.map(async (resp) => {
      const deleteRow = {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            customId: "deleteResp|" + message.author.id,
            label: "Delete",
            style: ButtonStyle.Secondary,
          },
        ],
      };
      message.reply({
        content: resp.response,
        components: resp.tag ? [] : [deleteRow],
        allowedMentions: { repliedUser: false },
      });
    })
  );
};
export const when = {
  all: "messages",
  desc: "Sends an autoresponse for the commands and suggestions we have",
};
