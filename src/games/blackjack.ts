import shuffle from 'shuffle-array';
import blackjackJson from '../json/blackjack.json';
import {
	ButtonInteraction,
	CommandInteraction,
	EmbedFieldData,
	InteractionCollector,
	Message,
	MessageActionRow,
	MessageButton,
	MessageEmbed
} from 'discord.js';
import {
	checkForNotReplied,
	checkForPermissions,
	tagAndAvatar
} from '../functions';
import { BlackjackCard, Buttons, GameParameters } from './../interfaces';
import { memberNicknameMention } from '@discordjs/builders';

const buttons: Buttons[] = [
	{
		id: 'hit',
		label: 'Hit',
		style: 'PRIMARY'
	},
	{
		id: 'stand',
		label: 'Stand',
		style: 'SUCCESS'
	}
];

const row = new MessageActionRow();
buttons.forEach((button) => {
	row.addComponents(
		new MessageButton()
			.setCustomId(button.id)
			.setLabel(button.label)
			.setStyle(button.style)
	);
});

/**
 * Plays a classic game of blackjack!
 * @param {GameParameters & object} options - Options for the game
 * @param {string} [options.embed.winMessage] - The message to display when the user win
 * @param {string} [options.embed.tieMessage] - The message to display when the user ties
 * @param {string} [options.embed.loseMessage] - The message to display when the user loses
 * @param {string} [options.embed.timeEndMessage] - The message to display when time runs out
 * @returns {Promise<'win' | 'tie' | 'loss'>} Returns whether the user won, tied, or lost
 * @author CarelessInternet
 */
export async function blackjack({
	message,
	embed = {}
}: {
	embed?: {
		winMessage?: string;
		tieMessage?: string;
		loseMessage?: string;
		timeEndMessage?: string;
		footer?: string;
	};
} & GameParameters): Promise<'win' | 'tie' | 'loss'> {
	embed.title ||= 'Blackjack';
	embed.color ||= 'RANDOM';
	embed.winMessage ||= '{user} has won against the dealer!';
	embed.tieMessage ||= "It's a tie!";
	embed.loseMessage ||= '{user} has lost against the dealer';
	embed.timeEndMessage ||= 'Time has ran out, nobody wins!';
	embed.footer ||= '';

	checkForNotReplied(message);

	const [tag, avatar] = tagAndAvatar(message);
	const gameEmbed = new MessageEmbed()
		.setColor(embed.color)
		.setAuthor(tag, avatar)
		.setTitle(embed.title)
		.setTimestamp()
		.setFooter(embed.footer);

	checkForPermissions(message, tag, avatar);

	const game = new Game(message, gameEmbed, {
		winMessage: embed.winMessage,
		tieMessage: embed.tieMessage,
		loseMessage: embed.loseMessage,
		timeEndMessage: embed.timeEndMessage
	});
	const result = await game.play();

	return result;
}

class Game {
	private deck: BlackjackCard[];
	private cards: {
		player: BlackjackCard[];
		dealer: BlackjackCard[];
	};
	private msg: Message;
	private authorId: string;
	private authorWon: 'win' | 'tie' | 'loss';

	constructor(
		private message: Message | CommandInteraction,
		private gameEmbed: MessageEmbed,
		private embedOptions: {
			winMessage: string;
			tieMessage: string;
			loseMessage: string;
			timeEndMessage: string;
		}
	) {
		this.cards = { player: [], dealer: [] };
		this.authorId =
			this.message instanceof Message
				? this.message.author.id
				: this.message.user.id;

		this.deck = this.createGame();

		// draw some cards
		this.player[0] = this.drawCard;
		this.player[1] = this.drawCard;
		this.dealer[0] = this.drawCard;

		// display those cards and hand value
		this.editFields();
	}

	public play(): Promise<'win' | 'tie' | 'loss'> {
		return new Promise(async (resolve, reject) => {
			const msg = await this.message.reply({
				embeds: [this.gameEmbed],
				components: [row],
				fetchReply: true
			});

			if (msg instanceof Message) {
				this.msg = msg;

				const collector = this.msg.createMessageComponentCollector({
					filter: (i) =>
						buttons.some((button) => button.id === i.customId) &&
						this.authorId === i.user.id,
					componentType: 'BUTTON',
					idle: 60 * 1000
				});

				collector.on('collect', (i) => {
					if (i.customId === 'hit') {
						this.player.push(this.drawCard);
						this.editFields();

						this.handValue('player')[1] >= 21
							? this.dealersTurn(i, collector)
							: i.update({ embeds: [this.gameEmbed] });
					} else if (i.customId === 'stand') {
						this.dealersTurn(i, collector);
					}
				});
				collector.on('end', (_collected, reason) => {
					switch (reason) {
						case 'idle': {
							msg.edit({
								content: this.embedOptions.timeEndMessage,
								embeds: [],
								components: []
							});
							reject('Game did not finish');
							break;
						}
						case 'messageDelete': {
							msg.channel.send({
								content: 'Game aborted because the message was deleted'
							});
							reject('Message was deleted, game did not finish');
							break;
						}
						case 'user': {
							resolve(this.authorWon);
							break;
						}
						default: {
							reject('Game most likely did not finish');
							break;
						}
					}
				});
			} else {
				reject('Got an APIMessage instead of a Message instance');
			}
		});
	}

	private get player() {
		return this.cards.player;
	}

	private get dealer() {
		return this.cards.dealer;
	}

	private createGame(): BlackjackCard[] {
		return shuffle(blackjackJson) as BlackjackCard[];
	}

	private get drawCard(): BlackjackCard {
		// @ts-ignore: the deck always has a card to draw, it cannot return undefined
		return this.deck.shift();
	}

	private cardValue(card: string): number {
		if (card === 'JACK' || card === 'QUEEN' || card === 'KING') return 10;
		else if (card === 'ACE') return 11;
		else return parseInt(card);
	}

	private handValue(hand: 'player' | 'dealer'): [string, number] {
		let score = this[hand].reduce(
			(acc, card) => acc + this.cardValue(card.value),
			0
		);
		let aces = this[hand].filter((card) => card.value === 'ACE').length;

		while (aces > 0) {
			if (score > 21) {
				score -= 10;
				aces--;
			} else {
				break;
			}
		}

		if (score < 21) return [score.toString(), score];
		else if (score === 21) return ['Blackjack!', score];
		else return ['Bust!', score];
	}

	private cardsAsString(hand: 'player' | 'dealer'): string {
		return this[hand].reduce((acc, card) => {
			return `${acc}\n ${card.value} of ${this.capitalize(card.suit)}`;
		}, '');
	}

	private capitalize(word: string): string {
		const lowercase = word.toLowerCase();
		return lowercase.charAt(0).toUpperCase() + lowercase.slice(1);
	}

	private editFields(): void {
		const fields: EmbedFieldData[] = [
			{ name: '', value: '' },
			{ name: '', value: '' },
			{ name: '', value: '' },
			{ name: '', value: '' },
			{ name: '', value: '' }
		];

		fields[0].name = 'Your Hand';
		fields[0].value = this.cardsAsString('player');
		fields[0].inline = true;

		fields[1].name = "Dealer's Hand";
		fields[1].value = this.cardsAsString('dealer');
		fields[1].inline = true;

		fields[2].name = '\u200B';
		fields[2].value = '\u200B';

		fields[3].name = 'Your Value';
		fields[3].value = this.handValue('player')[0];
		fields[3].inline = true;

		fields[4].name = "Dealer's Value";
		fields[4].value = this.handValue('dealer')[0];
		fields[4].inline = true;

		this.gameEmbed.setFields(fields);
	}

	private dealersTurn(
		i: ButtonInteraction,
		collector: InteractionCollector<ButtonInteraction>
	): void {
		this.msg.components = [];

		const arrayOf10 = ['JACK', 'QUEEN', 'KING', '10'];
		const [_playerScoreStr, playerScoreInt] = this.handValue('player');
		const hasBeginningAce = (cards: BlackjackCard[]) =>
			cards[0].value === 'ACE' || cards[1].value === 'ACE';

		const checkFor10 = (cards: BlackjackCard[]) =>
			cards.some((card) => arrayOf10.includes(card.value));

		const hasBlackjack = (cards: BlackjackCard[], score: number) =>
			checkFor10(cards) && score === 21;

		const playerHasBeginningAce = hasBeginningAce(this.player);

		if (playerScoreInt <= 21) {
			while (this.handValue('dealer')[1] < 17) {
				this.dealer.push(this.drawCard);
			}

			const [_dealerScoreStr, dealerScoreInt] = this.handValue('dealer');
			const dealerHasBeginningAce = hasBeginningAce(this.dealer);

			if (dealerScoreInt > 21 || playerScoreInt > dealerScoreInt) {
				this.authorWon = 'win';
			} else if (playerScoreInt === dealerScoreInt) {
				if (
					playerHasBeginningAce &&
					!dealerHasBeginningAce &&
					hasBlackjack(this.player, playerScoreInt)
				) {
					this.authorWon = 'win';
				} else if (
					dealerHasBeginningAce &&
					!playerHasBeginningAce &&
					hasBlackjack(this.dealer, dealerScoreInt)
				) {
					this.authorWon = 'loss';
				} else {
					this.authorWon = 'tie';
				}
			} else {
				this.authorWon = 'loss';
			}
		} else {
			this.authorWon = 'loss';
		}

		if (this.authorWon === 'win') {
			this.embedOptions.winMessage = this.embedOptions.winMessage.replace(
				new RegExp('{user}', 'g'),
				memberNicknameMention(this.authorId)
			);
			this.gameEmbed.setDescription(this.embedOptions.winMessage);
		} else if (this.authorWon === 'tie') {
			this.gameEmbed.setDescription(this.embedOptions.tieMessage);
		} else {
			this.embedOptions.loseMessage = this.embedOptions.loseMessage.replace(
				new RegExp('{user}', 'g'),
				memberNicknameMention(this.authorId)
			);
			this.gameEmbed.setDescription(this.embedOptions.loseMessage);
		}

		this.editFields();
		i.update({ embeds: [this.gameEmbed], components: this.msg.components });

		collector.stop();
	}
}
