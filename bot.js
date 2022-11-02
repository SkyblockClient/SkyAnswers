import { Client, GatewayIntentBits } from "discord.js";
import { promise } from "glob-promise";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

console.log("Connecting...");
client.once("ready", () => {
  console.log("Connected");
});
const loadHandlers = async () => {
  const handlerPaths = await promise("./handlers/**/*.js");
  client.handlers = await Promise.all(handlerPaths.map((path) => import(path)));
};

client.on("guildMemberUpdate", async (oldUser, newUser) => {
  if (!client.handlers) await loadHandlers();
  await Promise.all(
    client.handlers.map(async (handler) => {
      if (handler.when.all != "member updates") return;
      await handler.command(oldUser, newUser);
    })
  );
});

client.on("channelCreate", async (channel) => {
  if (!client.handlers) await loadHandlers();
  await Promise.all(
    client.handlers.map(async (handler) => {
      if (handler.when.all != "channels") return;
      await handler.command(channel);
    })
  );
});
client.on("interactionCreate", async (interaction) => {
  if (!client.handlers) await loadHandlers();
  const handler = client.handlers.find(
    (handler) =>
      handler.when.interactionId == interaction.customId.split("|")[0] &&
      handler.when.interactionType == interaction.type
  );
  if (!handler) {
    return await interaction.reply({
      content: `No matching handler found for \`${interaction.customId}\`. This is probably a bug.`,
      ephemeral: true,
    });
  }
  await handler.command(interaction);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!client.handlers) await loadHandlers();
  const content = message.content.toLowerCase();
  message.respond = (data) => message.reply({ ...data, allowedMentions: { repliedUser: false } });

  await Promise.all(
    client.handlers.map(async (handler) => {
      if (handler.when.all == "messages") await handler.command(message);
      if (!handler.when.starts) return;
      const match = handler.when.input
        ? handler.when.starts.find((name) => content.startsWith(name + " "))
        : handler.when.starts.find((name) => content == name);
      if (!match) return;

      if (handler.when.input) await handler.command(message, content.slice(match.length + 1));
      else await handler.command(message);
    })
  );
});

client.login();
