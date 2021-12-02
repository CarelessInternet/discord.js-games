import {
	CommandInteraction,
	ContextMenuInteraction,
	Message
} from 'discord.js';

export function tagAndAvatar(
	message: Message | CommandInteraction | ContextMenuInteraction
): string[] {
	const tag =
		message instanceof Message ? message.author.tag : message.user.tag;
	const avatar =
		message instanceof Message
			? message.author.displayAvatarURL({ dynamic: true })
			: message.user.displayAvatarURL({ dynamic: true });

	const id = message instanceof Message ? message.author.id : message.user.id;

	return [tag, avatar, id];
}
