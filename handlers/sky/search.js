import { searchEmbed } from "../../data.js";

/**
 * @param {import("../../bot.js").MessageData} message
 * @param {string} query
 */
export const command = async ({ channel, respond }, query) => {
  await channel.sendTyping();
  await respond(await searchEmbed(query));
};
export const when = {
  starts: ["sky search"],
  desc: "Searches for the query in the knowledge base",
  input: true,
};
