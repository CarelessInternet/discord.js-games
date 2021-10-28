import { MessageButtonStyleResolvable } from 'discord.js';

export interface Buttons {
	id: string;
	emoji: string;
	style: MessageButtonStyleResolvable;
}
