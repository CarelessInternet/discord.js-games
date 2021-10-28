import {
	CollectorFilter,
	CommandInteraction,
	GuildMember,
	Message,
	MessageActionRow,
	MessageButton,
	MessageComponentInteraction,
	MessageEmbed,
	NewsChannel,
	TextChannel,
	ThreadChannel
} from 'discord.js';
import { inlineCode, memberNicknameMention } from '@discordjs/builders';
import { Buttons } from './../interfaces/buttons';

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

export async function rps({
	message,
	opponent
}: {
	message: Message | CommandInteraction;
	opponent?: GuildMember;
}) {
	const buttons: Buttons[] = [
		{
			id: 'Rock',
			emoji: '🗿',
			style: 'PRIMARY'
		},
		{
			id: 'Paper',
			emoji: '📄',
			style: 'SUCCESS'
		},
		{
			id: 'Scissors',
			emoji: '✂️',
			style: 'DANGER'
		}
	];

	const row = new MessageActionRow();
	buttons.forEach((val) => {
		row.addComponents(
			new MessageButton()
				.setCustomId(val.id)
				.setLabel(val.emoji)
				.setStyle(val.style)
		);
	});
	// const row = new MessageActionRow().addComponents(
	// 	new MessageButton()
	// 	.setCustomId(buttons[0].id)
	// 	.setLabel(buttons[0].emoji)
	// 	.setStyle(buttons[0].style),
	// 	new MessageButton()
	// 	.setCustomId(buttons[1].id)
	// 	.setLabel(buttons[1].emoji)
	// 	.setStyle(buttons[1].style),
	// 	new MessageButton()
	// 	.setCustomId(buttons[2].id)
	// 	.setLabel(buttons[2].emoji)
	// 	.setStyle(buttons[2].style)
	// );

	if (message instanceof CommandInteraction) {
		if (message.deferred || message.replied) {
			throw new Error(
				"Message has already been replied or deferred to, please make sure it's not replied or deferred"
			);
		}

		const channel = message.channel;
		if (!channel) {
			throw new TypeError(
				'Missing a channel, did you forget to include partials?'
			);
		}
		if (
			channel instanceof TextChannel ||
			channel instanceof NewsChannel ||
			channel instanceof ThreadChannel
		) {
			const perms = channel.permissionsFor(message.guild?.me ?? '');

			if (!perms?.has('ADD_REACTIONS')) {
				const embed = new MessageEmbed()
					.setColor('DARK_RED')
					.setAuthor(
						message.user.tag,
						message.user.displayAvatarURL({ dynamic: true })
					)
					.setTitle('Missing Permissions')
					.setDescription(
						`❌ I am missing the ${inlineCode(
							'Add Reactions'
						)} permission, please give it to me before using this command`
					)
					.setTimestamp();

				return message.reply({ embeds: [embed] });
			}
			if (!perms?.has('SEND_MESSAGES')) {
				return;
			}
		}

		const gameEmbed = new MessageEmbed()
			.setColor('RANDOM')
			.setAuthor(
				message.user.tag,
				message.user.displayAvatarURL({ dynamic: true })
			)
			.setTitle('Rock Paper Scissors')
			.setDescription('Click on the buttons to play')
			.setTimestamp();

		if (opponent) {
			gameEmbed.addField('Opponent', memberNicknameMention(opponent.id));
		} else {
			try {
				const filter: CollectorFilter<[MessageComponentInteraction]> = (i) =>
					buttons.some((item) => item.id === i.customId) &&
					i.user.id === message.user.id;
				const msg = await message.reply({
					embeds: [gameEmbed],
					components: [row],
					fetchReply: true
				});

				if (msg instanceof Message) {
					const collector = msg.createMessageComponentCollector({
						filter,
						componentType: 'BUTTON',
						max: 1,
						time: 15 * 1000
					});

					collector.on('collect', (i) => {
						const reaction = i.customId;
						const bot = buttons[Math.floor(Math.random() * buttons.length)];

						gameEmbed.addField(
							'Your Choice',
							buttons.filter((item) => item.id === reaction)[0].emoji
						);
						gameEmbed.addField("Bot's Choice", bot.emoji);
						gameEmbed.addField('Outcome', outcome(reaction, bot.id, buttons));

						i.update({
							embeds: [gameEmbed],
							components: []
						});
					});
					collector.on('end', (collected, reason) => {
						switch (reason) {
							case 'time': {
								msg.edit({
									content: 'Game aborted due to no response',
									embeds: [],
									components: []
								});
								break;
							}
							case 'messageDelete': {
								message.channel?.send({
									content: 'Game aborted because the message was deleted'
								});
								break;
							}
							case 'channelDelete':
								break;
							case 'guildDelete':
								break;
							case 'limit':
								break;
							default: {
								break;
							}
						}
					});
				} else {
					await message.deleteReply();
					message.channel.send({
						content: `${memberNicknameMention(
							message.user.id
						)} An internal error occured while playing rock paper scissors, please try again`
					});
				}
			} catch (err) {
				return message.followUp({
					content:
						'An error occured whilst playing rock paper scissors, please try again later',
					ephemeral: true
				});
			}
		}
	} else if (message instanceof Message) {
		//e
	} else {
		throw new TypeError(
			'The message must be an instance of CommandInteraction or Message'
		);
	}
}
