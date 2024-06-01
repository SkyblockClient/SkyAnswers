import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';

const noExisto = 'this command no longer exists :(';
const witty = (cmd: string) => `ha ha very funny\n(you meant to say \`${cmd}\`)`;
const srs = (cmd: string) => `it's \`${cmd}\` now`;

/** Corrects incorrect commands */
@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate,
})
export class UserEvent extends Listener<typeof Events.MessageCreate> {
	public override run(message: Message<true>) {
		const content = message.content.toLowerCase();
		if (content.startsWith('sky mod'))
			return message.reply(witty('/mod'));
		if (content.startsWith('sky pack'))
			return message.reply(witty('/pack'));
		if (content.startsWith('sky discord'))
			return message.reply(witty('/discord'));
		if (content === 'sky invalidate')
			return message.reply(witty('/invalidate'));
		if (content === '-help')
			return message.reply(noExisto);
		if (content === '-pullrepo')
			return message.reply(srs('/invalidate'));
		if (content === '-repo')
			return message.reply(srs('/update'));

		if (content.startsWith('sky help'))
			return message.reply(noExisto);
		if (content === 'sky bump')
			return message.reply(srs('/bump'));
		if (content.startsWith('sky search'))
			return message.reply(srs('/search'));
		if (content.startsWith('-update'))
			return message.reply(srs('/update'));
		if (content.startsWith('-bupdate'))
			return message.reply(srs('/update beta:true'));
		if (content.startsWith('-mod'))
			return message.reply(srs('/mod'));
		if (content.startsWith('-pack'))
			return message.reply(srs('/pack'));

		return undefined;
	}
}
