import { CommandInteraction, GuildMember } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { rps } from '../../src/index';
import { Command } from '../interfaces';

export const category: Command['category'] = 'Games';

export const data: Command['data'] = new SlashCommandBuilder()
	.setName('rps')
	.setDescription('Play a classic game of rock paper scissors')
	.addUserOption((option) =>
		option
			.setName('opponent')
			.setDescription('The user you want to play against')
			.setRequired(false)
	);

export const execute: Command['execute'] = ({ interaction }) => {
	if (interaction instanceof CommandInteraction) {
		const opponent = interaction.options.getMember('opponent');
		rps({
			message: interaction,
			...(opponent instanceof GuildMember && {
				opponent,
				embed: {
					title: 'rps with slash command',
					color: 'BLURPLE'
				}
			})
		});
	} else {
		const opponent = interaction.mentions.members?.first();

		rps({
			message: interaction,
			...(opponent instanceof GuildMember && {
				opponent,
				embed: {
					title: 'rps with message'
				}
			})
		});
	}
};
