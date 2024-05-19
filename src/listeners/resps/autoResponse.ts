import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getJSON } from '../../data.js';

import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Message } from 'discord.js';
import { Roles, Servers } from '../../const.js';
import { MessageBuilder } from '@sapphire/discord.js-utilities';
import { z } from 'zod';

/** Sends an autoresponse for the commands and suggestions we have */
@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate
})
export class UserEvent extends Listener<typeof Events.MessageCreate> {
	public override async run(message: Message<true>) {
		const { member, channel } = message;
		if (!member) return;
		if (message.author.bot) return;

		let canAutoResp =
			channel.id == '780181693553704973' || // general
			channel.id == '1110717104757416027' || // skyblock talk
			channel.id == '1001798063964303390' || // support
			channel.id == '796546551878516766' || // bot commands
			(channel.name.startsWith('ticket-') && channel.guildId == Servers.SkyClient);
		if (member.roles.cache.has(Roles.NoAuto)) canAutoResp = false;

		const responses = await findAutoresps(message.content, canAutoResp);
		if (responses.length > 3) return;

		await Promise.all(
			responses.map(async (resp) => {
				const reply = new MessageBuilder({
					content: resp.response
				});
				const delRow = new ActionRowBuilder<ButtonBuilder>();
				delRow.addComponents(
					new ButtonBuilder({
						style: ButtonStyle.Danger,
						customId: 'deleteResp|' + message.author.id,
						label: '🗑️ Delete'
					})
				);
				if (!resp.tag) reply.setComponents([delRow]);
				message.reply(reply);
			})
		);
	}
}

const AutoResp = z.object({
	triggers: z.string().array().optional(),
	tag: z
		.string()
		.or(z.string().array())
		.transform((v) => (typeof v == 'string' ? [v] : v))
		.optional(),
	response: z.string()
});

const Resp = z.object({
	response: z.string(),
	tag: z.boolean()
});
type Resp = z.infer<typeof Resp>;

export async function findAutoresps(message: string, canAutoResp: boolean) {
	const options = AutoResp.array().parse(await getJSON('botautoresponse'));
	return options
		.map((option): Resp | undefined => {
			if (option.tag) {
				for (const tag of option.tag) {
					if (message.toLowerCase() == tag.toLowerCase()) return { response: option.response, tag: true };
				}
			}

			if (!canAutoResp) return;
			if (option.triggers)
				for (const re of option.triggers) {
					const matcher = new RegExp(re, 'is');
					if (matcher.test(message)) return { response: option.response, tag: false };
				}
			return;
		})
		.filter(Boolean) as Resp[];
}
