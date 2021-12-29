import { randomInt } from 'crypto';
import type { CommandInteraction } from 'discord.js';
import {
	ContextMenuInteraction,
	EmojiResolvable,
	GuildEmoji,
	Message,
	MessageEmbed
} from 'discord.js';
import { checkForNotReplied, tagAndAvatar } from '../functions';
import type { GameParameters } from '../interfaces';

/**
 * Rolls some dice. You have to validate if the user's dice rolls are between 1-6
 * @param {object & GameParameters} options - Options for the game
 * @param {EmojiResolvable[]} options.diceEmojis - The emojis to use for the dice
 * @param {number[]} options.dice - The user's dice rolls
 * @param {string} [options.embed.loseMessage] - The message to display when the user loses
 * @returns {Promise<boolean>} Returns whether or not the user won
 * @author CarelessInternet
 */
export async function dice({
	message,
	diceEmojis,
	dice,
	embed = {}
}: {
	diceEmojis: EmojiResolvable[];
	dice: number[];
	embed?: {
		loseMessage?: string;
	};
} & GameParameters): Promise<boolean> {
	const twoRolls = Array.isArray(dice) && dice.length === 2;

	embed.title ||= 'Dice Roll';
	embed.color ||= 'RANDOM';
	embed.winMessage ||= !twoRolls
		? '{roll1} and {dice1}, you won!'
		: '{roll1} & {roll2}, and {dice1} & {dice2}, you won!';
	embed.loseMessage ||= !twoRolls
		? '{roll1} and {dice1}, you lost'
		: '{roll1} & {roll2}, and {dice1} & {dice2}, you lost';
	embed.footer ||= '';

	checkForNotReplied(message);

	const [name, iconURL] = tagAndAvatar(message);
	const gameEmbed = new MessageEmbed()
		.setColor(embed.color)
		.setAuthor({ name, iconURL })
		.setTitle(embed.title)
		.setTimestamp()
		.setFooter({ text: embed.footer });

	for (const emoji of diceEmojis) {
		if (emoji instanceof GuildEmoji && !emoji.available) {
			throw new ReferenceError(`The emoji ${emoji.id} is not available`);
		}
	}

	const game = new Game(
		message,
		gameEmbed,
		{
			winMessage: embed.winMessage,
			loseMessage: embed.loseMessage
		},
		diceEmojis,
		dice,
		twoRolls
	);
	const result = await game.play();

	return result;
}

class Game {
	private rolledDice: number[];

	constructor(
		private message: Message | CommandInteraction | ContextMenuInteraction,
		private gameEmbed: MessageEmbed,
		private embedOptions: {
			winMessage: string;
			loseMessage: string;
		},
		private diceEmojis: EmojiResolvable[],
		private dice: number[],
		private twoRolls: boolean
	) {}

	// damn this is some trash code
	public async play(): Promise<boolean> {
		this.rolledDice = [this.rollDice];

		if (this.twoRolls) {
			this.rolledDice.push(this.rollDice);
		}

		const win = this.determineWin();
		let message: string;

		if (win) {
			message = this.embedOptions.winMessage
				.replace(/{roll1}/, this.diceEmojis[this.dice[0] - 1].toString())
				.replace(/{dice1}/, this.diceEmojis[this.rolledDice[0] - 1].toString());

			if (this.twoRolls) {
				message = message
					.replace(/{roll2}/, this.diceEmojis[this.dice[1] - 1].toString())
					.replace(
						/{dice2}/,
						this.diceEmojis[this.rolledDice[1] - 1].toString()
					);
			}
		} else {
			message = this.embedOptions.loseMessage
				.replace(/{roll1}/, this.diceEmojis[this.dice[0] - 1].toString())
				.replace(/{dice1}/, this.diceEmojis[this.rolledDice[0] - 1].toString());

			if (this.twoRolls) {
				message = message
					.replace(/{roll2}/, this.diceEmojis[this.dice[1] - 1].toString())
					.replace(
						/{dice2}/,
						this.diceEmojis[this.rolledDice[1] - 1].toString()
					);
			}
		}

		this.gameEmbed.setDescription(message);
		this.message.reply({ embeds: [this.gameEmbed] });

		return win;
	}

	private get rollDice() {
		return randomInt(1, 7);
	}

	private determineWin() {
		if (this.twoRolls) {
			// https://stackoverflow.com/a/6230314/12425926
			return this.dice.sort().join(',') === this.rolledDice.sort().join(',');
		} else {
			// for speed, no need to sort
			return this.rolledDice[0] === this.dice[0];
		}
	}
}
