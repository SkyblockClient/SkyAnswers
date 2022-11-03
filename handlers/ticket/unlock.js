import { setTicketOpen } from "./start.js";

export const command = async ({ channel, respond }) => {
  await setTicketOpen(channel, true);
  await respond({ content: "ticket opened (in theory)" });
};
export const when = {
  starts: ["sky unlock"],
  desc: "Makes the person who made a ticket have send message perms",
  input: false,
};
