import {
  ComponentType,
  ButtonStyle,
  OverwriteType,
  ChannelType,
} from "discord.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 *
 * @param {import("discord.js").GuildChannel} channel
 * @param {boolean} open
 */
export const setTicketOpen = async (channel, open) => {
  const perms = Array.from(channel.permissionOverwrites.cache.values());
  const creator = perms.find(
    (perm) =>
      perm.type == OverwriteType.Member &&
      perm.allow.equals(open ? 1024n : 3072n) &&
      perm.deny.equals(open ? 2048n : 0n)
  );
  console.log(
    open ? "opening" : "closing",
    `#${channel.name} (${channel.id})`,
    "for",
    creator
  );
  if (creator) {
    await channel.permissionOverwrites.edit(creator.id, { SendMessages: open });
  } else
    console.warn(
      `While ${open ? "opening" : "closing"} ticket, failed to find member in`,
      perms
    );
};

/**
 * @param {import("discord.js").NonThreadGuildBasedChannel} channel
 */
export const command = async (channel) => {
  if (
    !channel.name.startsWith("ticket-") ||
    channel.type != ChannelType.GuildText
  )
    return;
  await sleep(500);
  await channel.send({
    content: "What is your ticket about? You must click on one to continue.",
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            customId: "ticketCategorize|crash",
            label: "I'm crashing",
            style: ButtonStyle.Primary,
          },
          {
            type: ComponentType.Button,
            customId: "ticketCategorize|install",
            label: "I need help with the installer",
            style: ButtonStyle.Primary,
          },
          {
            type: ComponentType.Button,
            customId: "ticketCategorize|mods",
            label: "I need help with mods",
            style: ButtonStyle.Primary,
          },
          {
            type: ComponentType.Button,
            customId: "ticketCategorize|other",
            label: "Something else (meta)",
            style: ButtonStyle.Secondary,
          },
        ],
      },
    ],
  });
  await setTicketOpen(channel, false);
};
export const when = {
  all: "channels",
  desc: "Requires the user to choose a category for their ticket",
};
