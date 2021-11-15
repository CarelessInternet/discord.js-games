import { SlashCommandBuilder } from '@discordjs/builders';
import { blackjack } from '../../src';
import { Command } from '../interfaces';

export const category: Command['category'] = 'Games';

export const data: Command['data'] = new SlashCommandBuilder()
	.setName('blackjack')
	.setDescription('Play a classic game of blackjack');

export const execute: Command['execute'] = ({ interaction }) => {
	try {
		blackjack({ message: interaction }).catch(console.error);
	} catch (_err) {}
};
