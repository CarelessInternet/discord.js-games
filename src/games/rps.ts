import { CommandInteraction, Message } from 'discord.js';

export function rps({ message }: { message: Message | CommandInteraction }) {
	if (message instanceof CommandInteraction) {
		//
	} else if (message instanceof Message) {
		//
	} else {
		return new TypeError(
			'The message must be an instance of CommandInteraction or Message'
		);
	}
}
