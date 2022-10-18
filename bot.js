import { createClient } from "@supabase/supabase-js";
import { AuditLogEvent, Client, GatewayIntentBits } from "discord.js";
import { bump, help, search } from "./modules/commands.js";
import { handleNewTicket, interactions, unlockChannel } from "./modules/ticket.js";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
let kti;
const db = createClient("https://fkjmuugisxgmrklcfyaj.supabase.co", process.env.SB_KEY);
// HEY DON'T FORGET TO ADD OVERFLOW ANIMATIONS NOTICE FOR LOG PARSING
client.once("ready", () => {
  console.log("Connected"), (kti = client.users.cache.get("794377681331945524"));
});
client.on("error", (e) => console.error("Error:", e));
client.on("warning", (e) => console.warn("Warning:", e));
client.on("unhandledRejection", (error) => console.error("Promise rejection:", error));

client.on("guildMemberUpdate", async (_, user) => {
  if (user.id != kti.id) return;
  const fetchedUpdateLogs = await user.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberUpdate,
  });
  const fetchedRoleLogs = await user.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberRoleUpdate,
  });
  const lastUpdateLog = fetchedUpdateLogs.entries.first();
  const lastRoleLog = fetchedRoleLogs.entries.first();
  const updateLog =
    (lastUpdateLog?.target?.id == user.id && lastUpdateLog) ||
    (lastRoleLog?.target?.id == user.id && lastRoleLog);
  if (updateLog) {
    await user.send(
      `${updateLog.executor} updated you. Changes:
` +
        "```json\n" +
        JSON.stringify(updateLog.changes, null, 2) +
        "\n```"
    );
  } else {
    await user.send("You were updated, but the audit log was for someone else.");
  }
});

client.on("channelCreate", async (channel) => {
  if (!channel.name.startsWith("ticket-")) return;
  await handleNewTicket(channel);
});
client.on("interactionCreate", async (interaction) => {
  const handler = interactions[interaction.customId];
  if (handler) await handler(interaction);
});

const searchRegex = /sky search (.+)/;
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const content = message.content.toLowerCase();
  const searchMatch = content.match(searchRegex);
  const date = new Date();

  if (message.stickers.has("1019337107292049471")) {
    await kti.send("someone blamed you\n" + message.url);
  }
  if (content == "sky bump") await bump(message.channel);
  if (content == "sky unlock") await unlockChannel(message.channel);
  if (searchMatch) {
    await message.channel.sendTyping();
    await message.channel.send(await search(searchMatch[1], message.channel));
  }
  if (
    content.includes("<@794377681331945524>") &&
    date.getUTCHours() >= 3 &&
    date.getUTCHours() < 13
  ) {
    message.reply(
      "kti is probably away from their computer for the night (8PM-6AM my time, <t:14400:t>-<t:50400:t> your time)"
    );
  }
  if (content.startsWith("sky help") || content == "<@" + client.user.id + ">")
    await help(message.channel);

  const { error } = await db.from("messages").insert({
    id: message.id,
    time: new Date(message.createdTimestamp),
    status: message.member.presence?.status,
    author: message.member.id,
    pings: Array.from(message.mentions.users.values()).map((p) => p.id),
  });
  if (error) throw error;
});

client.login();
