import { SlashCommandBuilder } from '@discordjs/builders';
import { GuildMember, Message } from 'discord.js';
import { connectFour } from '../../src';
import { Command } from '../interfaces';

export const category: Command['category'] = 'Games';

export const data: Command['data'] = new SlashCommandBuilder()
	.setName('connect-four')
	.setDescription('Play connect four')
	.addUserOption((option) =>
		option
			.setName('opponent')
			.setDescription('The user you want to play against')
			.setRequired(false)
	);

export const execute: Command['execute'] = ({ interaction }) => {
	try {
		const opponent =
			interaction instanceof Message
				? interaction.mentions.members?.first()
				: interaction.options.getMember('opponent');

		connectFour({
			message: interaction,
			...(opponent instanceof GuildMember && { opponent })
		});
	} catch (_err) {}
};
