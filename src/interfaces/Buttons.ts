import { MessageButtonStyleResolvable } from 'discord.js';

export interface Buttons {
	id: string;
	label: string;
	style: MessageButtonStyleResolvable;
}
