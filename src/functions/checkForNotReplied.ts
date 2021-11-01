import { CommandInteraction } from 'discord.js';

export function checkForNotReplied(message: unknown): void {
	if (message instanceof CommandInteraction) {
		if (message.deferred || message.replied) {
			throw new Error(
				"Message has already been replied or deferred to, please make sure it's not replied or deferred"
			);
		}
	}
}
