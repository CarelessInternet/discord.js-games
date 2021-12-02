import { randomInt } from 'crypto';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Message } from 'discord.js';
import { dice } from '../../src';
import { Command } from '../interfaces';

export const category: Command['category'] = 'Games';

export const data: Command['data'] = new SlashCommandBuilder()
	.setName('dice')
	.setDescription('Rolls some dice')
	.addIntegerOption((option) =>
		option
			.setName('side')
			.setDescription('The number the side will lie on')
			.setRequired(true)
	)
	.addIntegerOption((option) =>
		option
			.setName('side2')
			.setDescription('The number the side will lie on')
			.setRequired(false)
	);

export const execute: Command['execute'] = ({ interaction, args }) => {
	try {
		if (!(interaction instanceof Message)) {
			const [side, side2] = [
				interaction.options.getInteger?.('side') ?? randomInt(1, 7),
				interaction.options.getInteger?.('side2')
			];

			dice({
				message: interaction,
				diceEmojis: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'],
				dice: side2 ? [side, side2] : [side]
			});
		} else {
			dice({
				message: interaction,
				diceEmojis: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'],
				dice: args?.[1]
					? [parseInt(args?.[0] ?? ''), parseInt(args[1])]
					: [parseInt(args?.[0] ?? '')]
			});
		}
	} catch (_err) {}
};
