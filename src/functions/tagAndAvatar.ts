import { CommandInteraction, Message } from 'discord.js';

export function tagAndAvatar(message: Message | CommandInteraction): string[] {
	const tag =
		message instanceof Message ? message.author.tag : message.user.tag;
	const avatar =
		message instanceof Message
			? message.author.displayAvatarURL({ dynamic: true })
			: message.user.displayAvatarURL({ dynamic: true });

	return [tag, avatar];
}
