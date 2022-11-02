import { ComponentType, ButtonStyle, OverwriteType } from "discord.js";

export const command = async (channel) => {
  const perms = Array.from(channel.permissionOverwrites.cache.values());
  const creator = perms.find(
    (perm) => perm.type == OverwriteType.Member && perm.allow.equals(3072n) && perm.deny.equals(0n)
  );
  if (creator) await channel.permissionOverwrites.edit(creator.id, { SendMessages: false });
  else console.warn("Could not lock channel", perms);

  await channel.send({
    content: "What is your ticket about? You must click on one to continue.",
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            customId: "crash",
            label: "I'm crashing",
            style: ButtonStyle.Primary,
          },
          {
            type: ComponentType.Button,
            customId: "install",
            label: "I need help with the installer",
            style: ButtonStyle.Primary,
          },
          {
            type: ComponentType.Button,
            customId: "mods",
            label: "I need help with mods",
            style: ButtonStyle.Primary,
          },
          {
            type: ComponentType.Button,
            customId: "other",
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
