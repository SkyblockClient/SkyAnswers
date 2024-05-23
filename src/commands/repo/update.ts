import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { createHash } from 'crypto';
import { ApplicationCommandOptionType, ButtonStyle, ComponentType } from 'discord.js';
import JSZip from 'jszip';
import { Mod, getJSON, getMods } from '../../data.js';
import { checkMember } from '../../lib/update.js';
import { Channels, Emojis, Servers } from '../../const.js';
import z from 'zod';
import { basename } from '@std/url';
import { DB, PendingUpdatesDB, readDB, writeDB } from '../../lib/db.js';

@ApplyOptions<Command.Options>({
	description: 'Updates a mod to the latest version supplied'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: 'url',
					description: 'Download URL',
					required: true
				},
				{
					type: ApplicationCommandOptionType.Boolean,
					name: 'beta',
					description: 'Beta',
					required: false
				}
			]
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!process.env.GH_KEY) return interaction.reply(`Missing GitHub API Key! ${Emojis.BlameWyvest}`);

		const { guild, channel } = interaction;
		if (!guild || !channel) return;
		const member = interaction.guild?.members.resolve(interaction.user);
		if (!member) return;
		const perms = await checkMember(member);
		if (!perms.all && !perms.perms) {
			if (member.permissions.has('Administrator')) return interaction.reply('💡 assign yourself Github Keeper');
			return interaction.reply(`${Emojis.YouWhat} you can't update any mods`);
		}

		const isProper = guild.id != Servers.SkyClient || channel.id == Channels.ModUpdating;
		if (!isProper) return interaction.reply(`💡 this command is only available in <#${Channels.ModUpdating}>`);

		const msg = await interaction.reply('👀 loading this mod...');

		const url = interaction.options.getString('url', true);
		if (!z.string().url().safeParse(url).success) return interaction.reply("this doesn't look like a URL to me 🤔");
		const modResp = await fetch(url, {
			headers: { 'User-Agent': 'github.com/SkyblockClient/SkyAnswers' }
		});
		if (!modResp.ok) {
			console.error(await modResp.text());
			throw new Error(`${modResp.statusText} while fetching ${url}`);
		}
		const modFile = await modResp.arrayBuffer();

		const modZip = await JSZip.loadAsync(modFile);
		const modInfoFile = modZip.file('mcmod.info');
		let modId: string | undefined;
		if (modInfoFile) {
			const modInfoStr = await modInfoFile.async('text');
			const modInfo = JSON.parse(modInfoStr);
			modId = modInfo[0].modid;
		}

		if (!modId) {
			await msg.edit("🫨 this mod doesn't have a mod id");
			return;
		}
		if (!perms.all && (perms.perms ? perms.perms[modId] != 'update' : false)) {
			await msg.edit(`🫨 you can't update that mod`);
			return;
		}

		//const file = decodeURI(url).split('/').pop().split('?')[0];
		const data = {
			forge_id: modId,
			url,
			file: basename(url),
			hash: createHash('md5').update(new Uint8Array(modFile)).digest('hex')
		};
		const isBeta = interaction.options.getBoolean('beta') || false;

		const modsRef = Mod.array().parse(await getMods());
		const mods = isBeta ? Mod.array().parse(await getJSON('mods_beta')) : modsRef;

		if (!modsRef.find((mod) => mod.forge_id == modId)) {
			return msg.edit("🤔 that mod doesn't exist");
		}

		const existingMod = mods.find((mod) => mod.forge_id == modId);

		if (existingMod && existingMod.url == data.url && existingMod.file == data.file && existingMod.hash == data.hash)
			return msg.edit('🤔 nothing to change');

		const pendingUpdates = PendingUpdatesDB.parse(await readDB(DB.PendingUpdates));
		pendingUpdates[msg.id] = {
			...data,
			initiator: member.id,
			beta: isBeta
		};
		await writeDB(DB.PendingUpdates, pendingUpdates);

		return msg.edit({
			content: '👀 does this look alright?',
			embeds: [
				{
					description: `forge_id: ${data.forge_id}
url: ${data.url}
file: ${data.file}
md5: ${data.hash}`
				}
			],
			components: [
				{
					type: ComponentType.ActionRow,
					components: [
						{
							type: ComponentType.Button,
							customId: 'updateCheck1',
							label: 'Start double-check',
							style: ButtonStyle.Success
						}
					]
				}
			]
		});
	}
}
