import { SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits, Partials } from 'discord.js';
import 'dotenv/config';

const client = new SapphireClient({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent
	],
	partials: [Partials.Channel],
	loadMessageCommandListeners: true
});

console.log('Connecting...');
client.login(process.env.BOT_TOKEN);
