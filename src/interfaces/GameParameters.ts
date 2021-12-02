import {
	ColorResolvable,
	CommandInteraction,
	ContextMenuInteraction,
	Message
} from 'discord.js';

export interface GameParameters {
	message: Message | CommandInteraction | ContextMenuInteraction;
	embed?: {
		title?: string;
		color?: ColorResolvable;
		footer?: string;
		winMessage?: string;
	};
}
