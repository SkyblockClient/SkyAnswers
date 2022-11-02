import { createClient } from "@supabase/supabase-js";
import files from "fs/promises";
import { AuditLogEvent, BaseInteraction, Client, GatewayIntentBits, Message } from "discord.js";
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
const db =
  process.env.SB_KEY &&
  createClient("https://fkjmuugisxgmrklcfyaj.supabase.co", process.env.SB_KEY);

client.once("ready", () => {
  console.log("Connected");
  kti = client.users.cache.get("794377681331945524");
});
client.on("error", (e) => console.error("Error:", e));
client.on("warning", (e) => console.warn("Warning:", e));
client.on("unhandledRejection", (error) => console.error("Promise rejection:", error));

const runCommandHandler = async function (input) {
  if (!(input instanceof Message)) return;
  input.respond = (data) => input.reply({ ...data, allowedMentions: { repliedUser: false } });
  const content = input.content.toLowerCase();
  await Promise.all(
    this.when.starts.map(async (name) => {
      if (this.when.input) {
        const prefix = name + " ";
        if (content.startsWith(prefix)) await this.command(input, content.slice(prefix.length));
      } else {
        if (content == name) await this.command(input);
      }
    })
  );
};
const runInteractionHandler = async function (input) {
  if (!(input instanceof BaseInteraction)) return;
  if (input.customId == this.when.interactionId && input.type == this.when.interactionType) {
    await this.command(input);
  }
};

const genHandlers = async () => {
  const groupsList = await files.readdir("./handlers");
  const handlers2dList = await Promise.all(
    groupsList.map(async (group) => {
      const handlers = await files.readdir(`./handlers/${group}`);
      return handlers.map((path) => `./handlers/${group}/${path}`);
    })
  );
  const handlers = [].concat(...handlers2dList);
  const handlersLoaded = await Promise.all(handlers.map((path) => import(path)));
  return handlersLoaded.map((handler) => {
    return {
      ...handler,
      run: handler.when.starts
        ? runCommandHandler.bind(handler)
        : handler.when.interactionId
        ? runInteractionHandler.bind(handler)
        : undefined,
    };
  });
};

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
  if (!client.handlers) client.handlers = await genHandlers();
  try {
    await Promise.all(client.handlers.map((handler) => handler.run(interaction)));
  } catch (e) {
    await interaction.message.reply("An error happened inside SkyAnswers, " + e), console.error(e);
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!client.handlers) client.handlers = await genHandlers();
  try {
    await Promise.all(client.handlers.map((handler) => handler.run(message)));
    return;
    const content = message.content.toLowerCase();

    if (message.stickers.has("1019337107292049471")) {
      await kti.send("someone blamed you\n" + message.url);
    }
    const date = new Date();
    if (
      content.includes("<@794377681331945524>") &&
      date.getUTCHours() >= 3 &&
      date.getUTCHours() < 13
    ) {
      message.reply(
        "kti is probably away from their computer for the night (8PM-6AM my time, <t:14400:t>-<t:50400:t> your time)"
      );
    }

    if (
      content.startsWith("sky mod") ||
      content.startsWith("sky pack") ||
      content.startsWith("sky discord") ||
      content == "-help"
    )
      await message.reply("ha ha very funny\n(you mixed up `sky ` and `-`)");
    if (content == "-pullrepo") await message.reply("it's `-invalidate` now");
    if (content == "-repo") await message.reply("it's `-update [dl url]` now");
    if (content == "sky bump") await bump(message.channel);
    if (content == "sky unlock") await unlockChannel(message.channel);
    if (content.startsWith("sky help") || content == "<@" + client.user.id + ">")
      await help(message.channel);
    await handleCommand("sky search", content, async (q) => {
      await message.channel.sendTyping();
      await message.channel.send(await search(q, message.channel));
    });
    await handleCommand("-mod", content, async (query) => await findItem(message, query, "mods"));
    await handleCommand("-pack", content, async (query) => await findItem(message, query, "packs"));
    if (content == "-mods" || content == "-modlist") await listMods(message);
    if (content == "-packs" || content == "-packlist") await listPacks(message);
    await handleCommand(
      "-discord",
      content,
      async (query) =>
        await message.reply({
          ...(await getDiscordMessage(query)),
          allowedMentions: { repliedUser: false },
        })
    );
    await handleCommand("-update", message.content, async (url) => await updateMod(message, url));
    if (content == "-invalidate") {
      invalidateTrackedData();
      await message.reply("cleared caches");
    }
    if (!message.member.roles.cache.has("852016624605462589")) {
      const responses = await findAutoresp(content);
      responses.forEach((resp) =>
        message.reply({ content: resp, allowedMentions: { repliedUser: false } })
      );
    }

    if (db) {
      const { error } = await db.from("messages").insert({
        id: message.id,
        time: new Date(message.createdTimestamp),
        status: message.member.presence?.status,
        author: message.member.id,
        pings: Array.from(message.mentions.users.values()).map((p) => p.id),
      });
      if (error) throw error;
    } else {
      console.warn("you should set up the db");
    }
  } catch (e) {
    await message.reply("An error happened inside SkyAnswers, " + e), console.error(e);
  }
});

client.login();
