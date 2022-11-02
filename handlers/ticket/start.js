import { ComponentType, ButtonStyle, OverwriteType } from "discord.js";

export const setTicketOpen = async (channel, open) => {
  /** @type {[import("discord.js").PermissionOverwrites]} */
  const perms = Array.from(channel.permissionOverwrites.cache.values());
  const creator = perms.find(
    (perm) =>
      perm.type == OverwriteType.Member &&
      perm.allow.equals(open ? 1024n : 3072n) &&
      perm.deny.equals(open ? 2048n : 0n)
  );
  if (creator) await channel.permissionOverwrites.edit(creator.id, { SendMessages: open });
  else console.warn("Could not set open for channel", perms);
};

export const command = async (channel) => {
  await setTicketOpen(channel, false);
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
};
export const when = {
  all: "channels",
  desc: "Requires the user to choose a category for their ticket",
};
