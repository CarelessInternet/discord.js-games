// https://github.com/aniket091/Gamecord really helped me with figuring out how to make connect 4

import {
	CommandInteraction,
	ContextMenuInteraction,
	GuildMember,
	Message,
	MessageActionRow,
	MessageButton,
	MessageEmbed
} from 'discord.js';
import { memberNicknameMention } from '@discordjs/builders';
import { randomInt } from 'crypto';
import {
	checkForNotReplied,
	checkForPermissions,
	tagAndAvatar
} from '../functions';
import { Buttons, GameParameters } from '../interfaces';

const buttons: Buttons[] = [
	{
		id: '1',
		label: '1️⃣',
		style: 'PRIMARY'
	},
	{
		id: '2',
		label: '2️⃣',
		style: 'SECONDARY'
	},
	{
		id: '3',
		label: '3️⃣',
		style: 'SUCCESS'
	},
	{
		id: '4',
		label: '4️⃣',
		style: 'DANGER'
	},
	{
		id: '5',
		label: '5️⃣',
		style: 'PRIMARY'
	},
	{
		id: '6',
		label: '6️⃣',
		style: 'SECONDARY'
	},
	{
		id: '7',
		label: '7️⃣',
		style: 'SUCCESS'
	}
];

const [row1, row2] = [new MessageActionRow(), new MessageActionRow()];
buttons.forEach((val, i) => {
	const button = new MessageButton()
		.setCustomId(val.id)
		.setEmoji(val.label)
		.setStyle(val.style);

	i < 4 ? row1.addComponents(button) : row2.addComponents(button);
});

/**
 * Plays a game of connect 4
 * @param {GameParameters & object} options - Options for the game
 * @param {GuildMember} [options.opponent] - The opponent the user wants to challenge
 * @param {string} [options.embed.tieMessage] - The message to display when the game ends in a tie
 * @param {string} [options.embed.timeEndMessage] - The message to display when time runs out
 * @returns {Promise<'win' | 'tie' | 'loss'>} Returns whether the user won, tied, or lost
 * @author CarelessInternet
 */
export async function connectFour({
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
	embed.title ||= 'Connect Four';
	embed.color ||= 'RANDOM';
	embed.winMessage ||= '{user} has won against {opponent}!';
	embed.tieMessage ||= "It's a tie!";
	embed.timeEndMessage ||= 'Time has ran out, nobody wins!';
	embed.footer ||= 'Red is the message author, yellow is the opponent';

	checkForNotReplied(message);

	const [tag, avatar, authorId] = tagAndAvatar(message);
	const gameEmbed = new MessageEmbed()
		.setColor(embed.color)
		.setAuthor(tag, avatar)
		.setTitle(embed.title)
		.setTimestamp()
		.setFooter(embed.footer);

	checkForPermissions(message, tag, avatar);

	if (opponent?.user.bot && opponent.user.id !== message.client.user?.id) {
		message.reply({
			content: 'User may not be a bot',
			...(message instanceof CommandInteraction && { ephemeral: true })
		});
		throw new Error('User is a bot, cannot play connect 4');
	}
	if (opponent?.user.id === authorId) {
		message.reply({
			content: 'You may not battle against yourself',
			...(message instanceof CommandInteraction && { ephemeral: true })
		});
		throw new Error(
			'User is trying to battle against himself, cannot play connect 4'
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
	private msg: Message;
	private board: string[];
	private authorsTurn: boolean;
	private authorId: string;
	private opponentId: string;
	private botId: string;
	private winner: string | null;
	private horizontalLength = buttons.length;
	private verticalLength = 6;
	private emojis = {
		empty: '🔵',
		redFilled: '🔴',
		yellowFilled: '🟡'
	};

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
		this.board = this.createBoard();
		this.authorId =
			this.message instanceof Message
				? this.message.author.id
				: this.message.user.id;

		this.botId = this.message.client.user?.id as string;
		this.opponentId = this.opponent?.user.id || this.botId;
		this.authorsTurn = this.opponentId === this.botId ? true : false;
		this.winner = null;
	}

	public play(): Promise<'win' | 'tie' | 'loss'> {
		return new Promise(async (resolve, reject) => {
			this.msg = (await this.message.reply({
				embeds: [this.getEmbed],
				components: [row1, row2],
				fetchReply: true
			})) as Message;

			const collector = this.msg.createMessageComponentCollector({
				filter: (i) =>
					buttons.some((item) => item.id === i.customId) &&
					[this.authorId, this.opponentId].some((id) => id === i.user.id),
				componentType: 'BUTTON',
				idle: 60 * 1000
			});

			collector.on('collect', (i) => {
				const turn = this.authorsTurn ? this.authorId : this.opponentId;

				if (turn === i.user.id) {
					const column = parseInt(i.customId) - 1;
					this.fillTile(column);

					if (this.opponentId === this.botId && !this.winner) {
						const randomColumn = randomInt(this.horizontalLength);
						this.fillTile(randomColumn);
					}

					i.update({
						embeds: [this.getEmbed],
						components: this.msg.components
					});

					if (this.winner) {
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

	private createBoard(): string[] {
		const board: string[] = [];

		for (let i = 0; i < this.verticalLength; i++) {
			for (let j = 0; j < this.horizontalLength; j++) {
				board[i * this.horizontalLength + j] = this.emojis.empty;
			}
		}

		return board;
	}

	private get getBoard(): string {
		let str = '';
		for (let i = 0; i < this.verticalLength; i++) {
			for (let j = 0; j < this.horizontalLength; j++) {
				str += this.board[i * this.horizontalLength + j];
			}

			str += '\n';
		}

		return str;
	}

	private get getEmbed(): MessageEmbed {
		const turn = this.authorsTurn ? this.authorId : this.opponentId;

		if (this.gameEmbed.fields.length) {
			this.gameEmbed.fields[0].value = this.getBoard;
		} else {
			this.gameEmbed.addField('Game:', this.getBoard);
		}

		if (this.winner) {
			this.msg.components = [];

			if (this.winner === 'tie') {
				this.gameEmbed.setDescription(this.embedOptions.tieMessage);
			} else {
				const winner =
					this.winner === this.authorId ? this.authorId : this.opponentId;
				const loser =
					this.winner === this.authorId ? this.opponentId : this.authorId;

				this.embedOptions.winMessage = this.embedOptions.winMessage.replace(
					new RegExp('{user}', 'g'),
					memberNicknameMention(winner)
				);
				this.embedOptions.winMessage = this.embedOptions.winMessage.replace(
					new RegExp('{opponent}', 'g'),
					memberNicknameMention(loser)
				);

				this.gameEmbed.setDescription(this.embedOptions.winMessage);
			}
		} else {
			this.gameEmbed.setDescription(
				`Current player's turn: ${memberNicknameMention(turn)}`
			);
		}

		return this.gameEmbed;
	}

	private fillTile(column: number): void {
		let [posX, posY] = [-1, -1];

		for (let i = this.board.length - 1; i >= 0; i--) {
			const index = i * this.horizontalLength + column;
			const tile = this.board[index];

			if (tile === this.emojis.empty) {
				this.board[index] = this.authorsTurn
					? this.emojis.redFilled
					: this.emojis.yellowFilled;
				posX = column;
				posY = i;

				break;
			}
		}

		if (posX === -1 && posY === -1) {
			// we have to make sure there is an empty tile so we don't recursively call
			// this function over and over and get some sort of error or crash the application.
			if (this.board.find((tile) => tile === this.emojis.empty)) {
				return this.fillTile(randomInt(this.horizontalLength));
			}
		}

		if (posY === 0) {
			this.msg.components[column > 3 ? 1 : 0].components[
				column > 3 ? column % 4 : column
			].disabled = true;
		}

		this.authorsTurn = !this.authorsTurn;
		this.checkForWinner(posX, posY);
	}

	private checkForWinner(posX: number, posY: number): void {
		const tile = !this.authorsTurn
			? this.emojis.redFilled
			: this.emojis.yellowFilled;
		const id = !this.authorsTurn ? this.authorId : this.opponentId;

		// horizontal
		const y = posY * this.horizontalLength;
		for (let i = Math.max(0, posX - 3); i <= posX; i++) {
			const adj = i + y;
			if (i + 3 < this.horizontalLength) {
				if (
					this.board[adj] === tile &&
					this.board[adj + 1] === tile &&
					this.board[adj + 2] === tile &&
					this.board[adj + 3] === tile
				) {
					this.winner = id;
					return;
				}
			}
		}

		// vertical
		for (let i = Math.max(0, posY - 3); i <= posY; i++) {
			const adj = i * this.horizontalLength + posX;
			if (i + 3 < this.verticalLength) {
				if (
					this.board[adj] === tile &&
					this.board[adj + this.horizontalLength] === tile &&
					this.board[adj + 2 * this.horizontalLength] === tile &&
					this.board[adj + 3 * this.horizontalLength] === tile
				) {
					this.winner = id;
					return;
				}
			}
		}

		// ascending diagonal
		for (let i = -3; i <= 0; i++) {
			const [adjX, adjY] = [posX + i, posY - i];
			const adj = adjY * this.horizontalLength + adjX;

			if (adjX + 3 < this.horizontalLength && adjY + 3 < this.verticalLength) {
				if (
					this.board[adj] === tile &&
					this.board[adj + this.horizontalLength + 1] === tile &&
					this.board[adj + 2 + 2 * this.horizontalLength] === tile &&
					this.board[adj + 3 + 3 * this.horizontalLength] === tile
				) {
					this.winner = id;
					return;
				}
			}
		}

		// descending diagonal
		for (let i = -3; i <= 0; i++) {
			const [adjX, adjY] = [posX + i, posY - i];
			const adj = adjY * this.horizontalLength + adjX;

			if (adjX + 3 < this.horizontalLength && adjY - 3 >= 0) {
				if (
					this.board[adj] === tile &&
					this.board[adj - this.horizontalLength + 1] === tile &&
					this.board[adj - 2 * this.horizontalLength + 2] === tile &&
					this.board[adj - 3 * this.horizontalLength + 3] === tile
				) {
					this.winner = id;
					return;
				}
			}
		}

		if (!this.winner) {
			if (!this.board.find((item) => item === this.emojis.empty)) {
				this.winner = 'tie';
			}
		}
	}
}
