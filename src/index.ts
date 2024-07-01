#!/usr/bin/env -S pnpm tsx

import { SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits, Partials } from "discord.js";
import "@sapphire/plugin-logger/register";
import "@sapphire/plugin-editable-commands/register";
import { setup } from "@skyra/env-utilities";

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
});

client.logger.info("Connecting...");
await client.login();
client.logger.info("Connected");

declare module "@skyra/env-utilities" {
  interface Env {
    GH_KEY: string;
    SB_KEY: string;
  }
}
