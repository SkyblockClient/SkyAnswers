import { Precondition } from '@sapphire/framework';
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js';
import { isDevUser, Servers } from '../const.js';

export class UserPrecondition extends Precondition {
	public override messageRun(message: Message) {
		return this.inPrivate(message.guildId);
	}

	public override chatInputRun(interaction: ChatInputCommandInteraction) {
		return this.inPrivate(interaction.guildId);
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
		return this.inPrivate(interaction.guildId);
	}

	private inPrivate(guildId: string | null) {
		return inPrivate(guildId) ? this.error() : this.ok();
	}
}

export const inPrivate = (guildId: string | null) => !(guildId == Servers.SkyClient || (guildId == Servers.Dev && isDevUser));

declare module '@sapphire/framework' {
	interface Preconditions {
		notPublic: never;
	}
}
