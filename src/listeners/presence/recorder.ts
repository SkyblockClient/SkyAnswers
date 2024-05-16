import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { createClient } from '@supabase/supabase-js';
import { inPrivate } from '../../preconditions/notPublic.js';
import { Message } from 'discord.js';

export const db = process.env.SB_KEY && createClient('https://fkjmuugisxgmrklcfyaj.supabase.co', process.env.SB_KEY);

/** Notes message times to figure out when people are online */
@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate
})
export class MessageListener extends Listener<typeof Events.MessageCreate> {
	public override async run(message: Message) {
		if (inPrivate(message.guildId)) return;
		if (!message.member) return;
		if (!db) {
			console.warn('you should set up the db');
			return;
		}

		const { error } = await db.from('messages').insert({
			id: message.id,
			time: new Date(message.createdTimestamp),
			status: message.member.presence?.status,
			author: message.member.id
		});
		if (error) throw error;
	}
}