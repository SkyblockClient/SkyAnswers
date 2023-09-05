import { Client, GatewayIntentBits, Partials } from "discord.js";
import { promise } from "glob-promise";
import { run } from "./ticketPinger.js";

/**
 * @typedef {Object} MessageExtra
 * @property {(input: import("discord.js").MessageReplyOptions) => Promise<import("discord.js").Message>} respond
 * @property {any} handlers
 *
 * @typedef {import("discord.js").Message & MessageExtra} MessageDataPublic
 * @typedef {import("discord.js").Message<true> & MessageExtra} MessageData
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});
let handlers;

console.log("Connecting...");
client.once("ready", () => {
  console.log("Connected");
  client.user.setPresence({ activities: [] });
  setInterval(() => {
    /**
     * @type {import("discord.js").PresenceStatusData[]}
     */
    const statuses = ["online", "idle", "dnd"];
    const index = Math.floor(Math.random() * statuses.length);
    client.user.setStatus(statuses[index]);
  }, 3000);
  setInterval(() => {
    const skyclient = client.guilds.cache.get("780181693100982273");
    if (!skyclient) return;
    run(skyclient);
  }, 60000);
});
const loadHandlers = async () => {
  const handlerPaths = await promise("./handlers/**/*.js");
  handlers = await Promise.all(handlerPaths.map((path) => import(path)));
};
const checkPublic = (interaction, handler) =>
  handler.when.public ||
  interaction.guildId == "780181693100982273" ||
  (interaction.guildId == "962319226377474078" &&
    interaction.client.user.id == "977585995174252624");

client.on("guildMemberUpdate", async (oldUser, newUser) => {
  if (!handlers) await loadHandlers();
  await Promise.all(
    handlers.map(async (handler) => {
      if (handler.when.all != "member updates") return;
      if (!checkPublic({ guildId: newUser.guild.id }, handler)) return;
      await handler.command(oldUser, newUser);
    })
  );
});

client.on("channelCreate", async (channel) => {
  if (!handlers) await loadHandlers();
  await Promise.all(
    handlers.map(async (handler) => {
      if (handler.when.all != "channels") return;
      if (!checkPublic(channel, handler)) return;
      await handler.command(channel);
    })
  );
});
client.on("interactionCreate", async (interaction) => {
  if (!handlers) await loadHandlers();
  const name =
    "customId" in interaction
      ? interaction.customId.split("|")[0]
      : interaction.commandName;
  const handler = handlers.find(
    (handler) =>
      handler.when.interactionId == name &&
      handler.when.interactionType == interaction.type &&
      checkPublic(interaction, handler)
  );
  if (handler) {
    try {
      await handler.command(interaction);
    } catch (e) {
      console.error(e);
      await interaction.channel.send(
        "An error happened inside SkyAnswers, " + e
      );
    }
  } else if ("reply" in interaction) {
    await interaction.reply({
      content:
        `No matching handler found for \`${name}\` with interaction type ` +
        `\`${interaction.type}\`. This is probably a bug.`,
      ephemeral: true,
    });
  }
});

client.on("messageCreate", async (/** @type {MessageData} */ message) => {
  if (message.author.bot) return;
  if (!handlers) await loadHandlers();
  const content = message.content.toLowerCase();
  message.respond = (data) =>
    message.reply({ ...data, allowedMentions: { repliedUser: false } });
  message.handlers = handlers;

  try {
    await Promise.all(
      handlers.map(async (handler) => {
        if (!checkPublic(message, handler)) return;
        if (handler.when.all == "messages") await handler.command(message);
        if (!handler.when.starts) return;

        const match = handler.when.starts.find(
          (name) => content == name || content.startsWith(name + " ")
        );
        if (!match) return;
        const takesInput = handler.when.input;
        const hasInput = content.length > match.length;
        if (takesInput && !hasInput) {
          await message.reply("Please provide input");
          return;
        }
        if (!takesInput && hasInput) {
          await message.reply("Don't provide input");
          return;
        }

        if (takesInput)
          await handler.command(message, content.slice(match.length + 1));
        else await handler.command(message);
      })
    );
  } catch (e) {
    await message.reply("An error happened inside SkyAnswers, " + e);
    console.error(e);
  }
});

client.login();
