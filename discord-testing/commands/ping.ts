import { SlashCommandBuilder } from '@discordjs/builders';
import { Message, MessageEmbed } from 'discord.js';
import { Command } from '../interfaces';

export const category: Command['category'] = 'Utility';

export const data: Command['data'] = new SlashCommandBuilder()
	.setName('ping')
	.setDescription(
		'Sends a pong back to test connection between the bot and the server/user'
	);

export const execute: Command['execute'] = async function ({
	client,
	interaction
}) {
	const embed = new MessageEmbed()
		.setColor('RANDOM')
		.setAuthor(
			interaction.user.tag,
			interaction.user.displayAvatarURL({ dynamic: true })
		)
		.setTitle('Pinging...')
		.setTimestamp();

	try {
		const msg = await interaction.reply({
			embeds: [embed],
			fetchReply: true
		});

		if (msg instanceof Message) {
			embed.setTitle('Result:');

			embed.addField('Ping', `⌛ ${client.ws.ping}ms`);
			embed.addField(
				'Latency',
				`🏓 Roughly ${msg.createdTimestamp - interaction.createdTimestamp}ms`
			);

			msg.edit({ embeds: [embed] });
		}
	} catch (err) {
		console.error(err);
		interaction.followUp({
			content: 'An error occured while pinging, please try again later',
			ephemeral: true
		});
	}
};
