import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, Message } from 'discord.js';
import { slotMachine } from '../../src';
import { Command } from '../interfaces';

export const category: Command['category'] = 'Games';

export const data: Command['data'] = new SlashCommandBuilder()
	.setName('slot-machine')
	.setDescription('Play the slot machine');

export const execute: Command['execute'] = ({ interaction }) => {
	slotMachine({
		message: interaction,
		emojis: ['😔', '🥱', '🦴', '🎱'],
		...(interaction instanceof CommandInteraction && {
			embed: { color: 'NOT_QUITE_BLACK', winMessage: 'good job boi' }
		}),
		...(interaction instanceof Message && {
			embed: { title: 'slot machine with message', loseMessage: 'boi u suck' }
		})
	});
};
