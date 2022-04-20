import type {
	ButtonInteraction,
	ContextMenuInteraction,
	GuildMember
} from 'discord.js';
import {
	CommandInteraction,
	Message,
	MessageActionRow,
	MessageButton,
	MessageEmbed
} from 'discord.js';
import { userMention } from '@discordjs/builders';
import type { Buttons, GameParameters, RPSReacted } from '../interfaces';
import {
	checkForNotReplied,
	checkForPermissions,
	tagAndAvatar
} from '../functions';

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

/**
 * Play a game of rock paper scissors
 * @param {GameParameters & object} options - Options for the game
 * @param {GuildMember} [options.opponent] - The opponent the user want to challenge
 * @param {string} [options.embed.tieMessage] - The message to display when the user loses
 * @param {string} [options.embed.timeEndMessage] - The message to display when time runs out
 * @returns {Promise<'win' | 'tie' | 'loss'>} Returns nothing, throws an error if you have messed something up
 * @author CarelessInternet
 */
export async function rps({
	message,
	opponent,
	embed = {}
}: {
	opponent?: GuildMember;
	embed?: {
		tieMessage?: string;
		timeEndMessage?: string;
	};
} & GameParameters): Promise<'win' | 'tie' | 'loss'> {
	embed.title ||= 'Rock Paper Scissors';
	embed.color ||= 'RANDOM';
	embed.winMessage ||= '{user} has won against {opponent}!';
	embed.tieMessage ||= "It's a tie!";
	embed.timeEndMessage ||= 'Time has ran out, nobody wins!';
	embed.footer ||= '';

	checkForNotReplied(message);

	const [name, iconURL, authorId] = tagAndAvatar(message);
	const gameEmbed = new MessageEmbed()
		.setColor(embed.color)
		.setAuthor({ name, iconURL })
		.setTitle(embed.title)
		.setDescription('Click on the buttons to play')
		.setTimestamp()
		.setFooter({ text: embed.footer });

	checkForPermissions(message, name, iconURL);

	if (opponent?.user.bot && opponent.user.id !== message.client.user?.id) {
		message.reply({
			content: 'User may not be a bot',
			...(message instanceof CommandInteraction && { ephemeral: true })
		});
		throw new Error('User is a bot, cannot play rock paper scissors');
	}
	if (opponent?.id === authorId) {
		message.reply({
			content: 'You cannot battle against yourself',
			...(message instanceof CommandInteraction && { ephemeral: true })
		});
		throw new Error(
			'User is trying to battle against himself, cannot play rock paper scissors'
		);
	}

	const game = new Game(
		message,
		gameEmbed,
		{
			winMessage: embed.winMessage,
			tieMessage: embed.tieMessage,
			timeEndMessage: embed.timeEndMessage
		},
		opponent
	);
	const result = await game.play();

	return result;
}

class Game {
	private botId: string;
	private opponentId: string;
	private authorId: string;
	private winner: string | null;
	private msg: Message<boolean>;
	private reacted: RPSReacted[];

	constructor(
		private message: Message | CommandInteraction | ContextMenuInteraction,
		private gameEmbed: MessageEmbed,
		private embedOptions: {
			winMessage: string;
			tieMessage: string;
			timeEndMessage: string;
		},
		private opponent?: GuildMember
	) {
		this.authorId =
			this.message instanceof Message
				? this.message.author.id
				: this.message.user.id;
		this.botId = this.message.client.user?.id as string;
		this.opponentId = this.opponent?.user.id || this.botId;
		this.reacted = [];
		this.winner = null;
	}

	public async play(): Promise<'win' | 'tie' | 'loss'> {
		return new Promise(async (resolve, reject) => {
			this.msg = (await this.message.reply({
				embeds: [this.gameEmbed],
				components: [row],
				fetchReply: true
			})) as Message;

			const collector = this.msg.createMessageComponentCollector({
				filter: (i) =>
					buttons.some((item) => item.id === i.customId) &&
					[this.authorId, this.opponentId].some((id) => id === i.user.id),
				componentType: 'BUTTON',
				idle: 60 * 1000
			});

			collector.on('collect', async (i) => {
				if (!this.reacted.some((item) => item.userId === i.user.id)) {
					this.reacted.push({ userId: i.user.id, customId: i.customId });

					if (this.reacted.length < 2 && this.opponentId !== this.botId) {
						this.gameEmbed.setDescription(
							`Waiting for ${userMention(
								i.user.id === this.authorId ? this.opponentId : this.authorId
							)}...`
						);

						i.update({ embeds: [this.gameEmbed] });
					}

					if (this.opponentId === this.botId || this.reacted.length >= 2) {
						await this.evaluateWinner(i);
						collector.stop();
					}
				}
			});
			collector.on('end', (_collected, reason) => {
				switch (reason) {
					case 'idle': {
						this.msg.edit({
							content: this.embedOptions.timeEndMessage,
							embeds: [],
							components: []
						});
						reject('Game did not finish');
						break;
					}
					case 'messageDelete': {
						this.msg.channel.send({
							content: 'Game aborted because the message was deleted'
						});
						reject('Message was deleted, game did not finish');
						break;
					}
					case 'user': {
						resolve(
							this.winner === this.authorId
								? 'win'
								: this.winner === 'tie'
								? 'tie'
								: 'loss'
						);
						break;
					}
					default: {
						reject('Game most likely did not finish');
					}
				}
			});
		});
	}

	private get outcome(): string {
		const [player, opponent] = [
			this.reacted[0].customId,
			this.reacted[1].customId
		];

		if (
			(player === buttons[0].id && opponent === buttons[2].id) ||
			(player === buttons[2].id && opponent === buttons[1].id) ||
			(player === buttons[1].id && opponent === buttons[0].id)
		) {
			return this.reacted[0].userId;
		} else if (player === opponent) {
			return 'tie';
		} else {
			return this.reacted[1].userId;
		}
	}

	private async evaluateWinner(i: ButtonInteraction): Promise<void> {
		if (this.opponentId === this.botId) {
			this.reacted.push({
				userId: this.opponentId,
				customId: buttons[Math.floor(Math.random() * buttons.length)].id
			});
		}

		this.winner = this.outcome;

		if (this.winner === 'tie') {
			this.gameEmbed.setDescription(this.embedOptions.tieMessage);
		} else {
			const winner =
				this.winner === this.authorId ? this.authorId : this.opponentId;
			const loser =
				this.winner === this.authorId ? this.opponentId : this.authorId;

			this.embedOptions.winMessage = this.embedOptions.winMessage.replace(
				new RegExp('{user}', 'g'),
				userMention(winner)
			);
			this.embedOptions.winMessage = this.embedOptions.winMessage.replace(
				new RegExp('{opponent}', 'g'),
				userMention(loser)
			);

			this.gameEmbed.setDescription(this.embedOptions.winMessage);
		}

		this.gameEmbed.addField('Opponent', userMention(this.opponentId), true);
		this.gameEmbed.addField(
			'Choice',
			buttons.filter((item) => item.id === this.reacted[0].customId)[0].label,
			true
		);
		this.gameEmbed.addField(
			'Choice',
			buttons.filter((item) => item.id === this.reacted[1].customId)[0].label,
			true
		);

		await i.update({ embeds: [this.gameEmbed], components: [] });
	}
}
