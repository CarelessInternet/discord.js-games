import {
	ButtonInteraction,
	ColorResolvable,
	CommandInteraction,
	GuildMember,
	Message,
	MessageActionRow,
	MessageButton,
	MessageEmbed,
	NewsChannel,
	TextChannel,
	ThreadChannel
} from 'discord.js';
import { inlineCode, memberNicknameMention } from '@discordjs/builders';
import { Buttons, RPSReacted } from './../interfaces';

const buttons: Buttons[] = [
	{
		id: 'Rock',
		label: '🗿',
		style: 'PRIMARY'
	},
	{
		id: 'Paper',
		label: '📄',
		style: 'SUCCESS'
	},
	{
		id: 'Scissors',
		label: '✂️',
		style: 'DANGER'
	}
];

const row = new MessageActionRow();
buttons.forEach((val) => {
	row.addComponents(
		new MessageButton()
			.setCustomId(val.id)
			.setLabel(val.label)
			.setStyle(val.style)
	);
});

const interactionFilter = (i: ButtonInteraction, players: string[]) =>
	buttons.some((item) => item.id === i.customId) &&
	players.some((id) => id === i.user.id);

/**
 * Play a game of rock paper scissors
 * @param {object} options - Important variables to handle the game
 * @param {Message | CommandInteraction} options.message - The message or interaction from the user
 * @param {GuildMember} [options.opponent] - The opponent the user want to challenge
 * @param {string} [options.embedTitle] - The title of the embed, default is 'Rock Paper Scissors'
 * @returns {Promise<void>} Returns nothing, throws an error if you have messed something up
 * @author CarelessInternet
 */
export async function rps({
	message,
	opponent,
	embedTitle = 'Rock Paper Scissors',
	embedColor = 'RANDOM'
}: {
	message: Message | CommandInteraction;
	opponent?: GuildMember;
	embedTitle?: string;
	embedColor?: ColorResolvable;
}): Promise<void> {
	const tag =
		message instanceof Message ? message.author.tag : message.user.tag;
	const avatar =
		message instanceof Message
			? message.author.displayAvatarURL({ dynamic: true })
			: message.user.displayAvatarURL({ dynamic: true });

	const gameEmbed = new MessageEmbed()
		.setColor(embedColor)
		.setAuthor(tag, avatar)
		.setTitle(embedTitle)
		.setDescription('Click on the buttons to play')
		.setTimestamp();

	const channel = message.channel;

	// usually a channel is always included, if it isn't, it's most likely due to missing partials like in dm channels
	if (!channel) {
		throw new TypeError(
			'Missing a channel, did you forget to include partials?'
		);
	}

	// if it's not a dm channel, check for sufficient permissions
	if (
		channel instanceof TextChannel ||
		channel instanceof NewsChannel ||
		channel instanceof ThreadChannel
	) {
		const perms = channel.permissionsFor(message.guild?.me ?? '');

		if (!perms?.has('ADD_REACTIONS')) {
			const embed = new MessageEmbed()
				.setColor('DARK_RED')
				.setAuthor(tag, avatar)
				.setTitle('Missing Permissions')
				.setDescription(
					`❌ I am missing the ${inlineCode(
						'Add Reactions'
					)} permission, please give it to me before using this command`
				)
				.setTimestamp();

			message.reply({ embeds: [embed] });
			return;
		}
		if (!perms?.has('SEND_MESSAGES')) {
			return;
		}
	}

	if (opponent) {
		const id = message instanceof Message ? message.author.id : message.user.id;

		if (opponent.id === id) {
			message.reply({
				content: 'You cannot battle against yourself',
				...(message instanceof CommandInteraction && { ephemeral: true })
			});
			return;
		}
	}

	if (message instanceof CommandInteraction) {
		if (message.deferred || message.replied) {
			throw new Error(
				"Message has already been replied or deferred to, please make sure it's not replied or deferred"
			);
		}

		if (opponent) {
			const opponentId = opponent.id;
			gameEmbed.addField('Opponent', memberNicknameMention(opponentId), true);

			const msg = await message.reply({
				embeds: [gameEmbed],
				components: [row],
				fetchReply: true
			});

			try {
				if (msg instanceof Message) {
					const collector = msg.createMessageComponentCollector({
						filter: (i) => interactionFilter(i, [message.user.id, opponentId]),
						componentType: 'BUTTON',
						maxUsers: 2,
						time: 15 * 1000
					});
					const reacted: RPSReacted[] = [];

					collector.on('collect', (i: ButtonInteraction) => {
						if (!reacted.some((item) => item.userId === i.user.id)) {
							reacted.push({ userId: i.user.id, customId: i.customId });

							// max length is 2, which means that all players have reacted, that's why it is 2 and not some other number
							if (reacted.length !== 2) {
								gameEmbed.setDescription(
									`Waiting for ${memberNicknameMention(
										opponentId === i.user.id ? message.user.id : opponentId
									)}...`
								);

								i.update({ embeds: [gameEmbed] });
							}
						}

						if (reacted.length === 2) {
							const embed = getOpponentWinner(
								reacted[0],
								reacted[1],
								gameEmbed
							);

							i.update({ embeds: [embed], components: [] });
						}
					});
					collector.on('end', (collected, reason) => {
						collectorEnd(reason, msg);
					});
				} else {
					throw new TypeError(
						'Got an APIMessage instead of a Message instance'
					);
				}
			} catch (err: unknown) {
				message.followUp({
					content: `An error occured whilst playing rock paper scissors, please try again later\nError: ${err}`,
					ephemeral: true
				});
			}
		} else {
			const msg = await message.reply({
				embeds: [gameEmbed],
				components: [row],
				fetchReply: true
			});

			try {
				if (msg instanceof Message) {
					const collector = msg.createMessageComponentCollector({
						filter: (i) => interactionFilter(i, [message.user.id]),
						componentType: 'BUTTON',
						maxUsers: 1,
						time: 15 * 1000
					});

					collector.on('collect', (i: ButtonInteraction) => {
						const reaction = i.customId;
						const bot = buttons[Math.floor(Math.random() * buttons.length)];
						const embed = getBotWinner(reaction, bot, gameEmbed);

						i.update({
							embeds: [embed],
							components: []
						});
					});
					collector.on('end', (collected, reason) => {
						collectorEnd(reason, msg);
					});
				} else {
					throw new TypeError(
						'Got an APIMessage instead of a Message instance'
					);
				}
			} catch (err: unknown) {
				message.followUp({
					content: `An error occured whilst playing rock paper scissors, please try again later\n Error: ${err}`,
					ephemeral: true
				});
			}
		}
	} else if (message instanceof Message) {
		if (opponent) {
			const opponentId = opponent.id;
			gameEmbed.addField('Opponent', memberNicknameMention(opponentId), true);

			const msg = await message.reply({
				embeds: [gameEmbed],
				components: [row]
			});

			try {
				const collector = msg.createMessageComponentCollector({
					filter: (i) => interactionFilter(i, [message.author.id, opponentId]),
					componentType: 'BUTTON',
					maxUsers: 2,
					time: 15 * 1000
				});
				const reacted: RPSReacted[] = [];

				collector.on('collect', (i: ButtonInteraction) => {
					if (!reacted.some((item) => item.userId === i.user.id)) {
						reacted.push({ userId: i.user.id, customId: i.customId });

						if (reacted.length !== 2) {
							gameEmbed.setDescription(
								`Waiting for ${memberNicknameMention(
									opponentId === i.user.id ? message.author.id : opponentId
								)}...`
							);

							i.update({ embeds: [gameEmbed] });
						}
					}

					if (reacted.length === 2) {
						const embed = getOpponentWinner(reacted[0], reacted[1], gameEmbed);

						i.update({ embeds: [embed], components: [] });
					}
				});
				collector.on('end', (collected, reason) => {
					collectorEnd(reason, msg);
				});
			} catch (err: unknown) {
				message.reply({
					content: `An error occured whilst playing rock paper scissors, please try again later\nError: ${err}`
				});
			}
		} else {
			const msg = await message.reply({
				embeds: [gameEmbed],
				components: [row]
			});

			try {
				if (msg instanceof Message) {
					const collector = msg.createMessageComponentCollector({
						filter: (i) => interactionFilter(i, [message.author.id]),
						componentType: 'BUTTON',
						maxUsers: 1,
						time: 15 * 1000
					});

					collector.on('collect', (i: ButtonInteraction) => {
						const reaction = i.customId;
						const bot = buttons[Math.floor(Math.random() * buttons.length)];
						const embed = getBotWinner(reaction, bot, gameEmbed);

						i.update({
							embeds: [embed],
							components: []
						});
					});
					collector.on('end', (collected, reason) => {
						collectorEnd(reason, msg);
					});
				} else {
					throw new TypeError(
						'Got an APIMessage instead of a Message instance'
					);
				}
			} catch (err: unknown) {
				message.reply({
					content: `An error occured whilst playing rock paper scissors, please try again later\n Error: ${err}`
				});
			}
		}
	} else {
		throw new TypeError(
			'The message must be an instance of CommandInteraction or Message'
		);
	}
}

function outcome(
	player: string,
	bot: string,
	emojis: Buttons[]
): 'Win' | 'Tie' | 'Loss' {
	if (
		(player === emojis[0].id && bot === emojis[2].id) ||
		(player === emojis[2].id && bot === emojis[1].id) ||
		(player === emojis[1].id && bot === emojis[0].id)
	) {
		return 'Win';
	} else if (player === bot) {
		return 'Tie';
	} else {
		return 'Loss';
	}
}

function getBotWinner(
	reaction: string,
	bot: Buttons,
	embed: MessageEmbed
): MessageEmbed {
	embed.addField(
		'Your Choice',
		buttons.filter((item) => item.id === reaction)[0].label,
		true
	);
	embed.addField("Bot's Choice", bot.label, true);
	embed.addField('Outcome', outcome(reaction, bot.id, buttons), true);

	return embed;
}

function getOpponentWinner(
	player1: RPSReacted,
	player2: RPSReacted,
	embed: MessageEmbed
): MessageEmbed {
	embed.setDescription('View results below!');

	const result = outcome(player1.customId, player2.customId, buttons);

	const choices = [
		`${memberNicknameMention(player1.userId)} ${
			buttons.filter((item) => item.id === player1.customId)[0].label
		}`,
		`${memberNicknameMention(player2.userId)} ${
			buttons.filter((item) => item.id === player2.customId)[0].label
		}`
	].join('\n');
	embed.addField('Choices', choices, true);

	if (result === 'Win') {
		embed.addField(
			'Outcome',
			`${memberNicknameMention(player1.userId)} Won`,
			true
		);
	} else if (result === 'Loss') {
		embed.addField(
			'Outcome',
			`${memberNicknameMention(player2.userId)} Won`,
			true
		);
	} else {
		embed.addField('Outcome', 'Tie', true);
	}

	return embed;
}

function collectorEnd(reason: string, msg: Message): void {
	switch (reason) {
		case 'time': {
			msg.edit({
				content: 'Game aborted due to no response from one or both users',
				embeds: [],
				components: []
			});
			break;
		}
		case 'messageDelete': {
			msg.channel.send({
				content: 'Game aborted because the message was deleted'
			});
			break;
		}
		default: {
			break;
		}
	}
}
