import { SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits, Partials } from "discord.js";
import "@sapphire/plugin-editable-commands/register";
import { setup } from "@skyra/env-utilities";
import logger from "./lib/logger.ts";

setup();

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
  loadMessageCommandListeners: true,
  logger,
});

logger.info("Connecting...");
await client.login();
logger.info("Connected");

declare module "@skyra/env-utilities" {
  interface Env {
    GH_KEY: string;
    SB_KEY: string;
  }
}
