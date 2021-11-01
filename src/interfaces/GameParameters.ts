import { ColorResolvable, CommandInteraction, Message } from 'discord.js';

export interface GameParameters {
	message: Message | CommandInteraction;
	embed?: {
		title?: string;
		color?: ColorResolvable;
	};
}
