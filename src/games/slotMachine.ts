import { randomInt } from 'crypto';
import { EmojiResolvable, MessageEmbed, GuildEmoji } from 'discord.js';
import { GameParameters } from '../interfaces';
import { checkForNotReplied, tagAndAvatar } from '../functions';

/**
 * Plays the slot machine
 * @param {GameParameters & object} options - Options for the game
 * @param {EmojiResolvable[]} options.emojis - The emojis of the slot machine
 * @param {string} [options.embed.loseMessage] - The lose message if the user loses
 * @returns {Promise<boolean>} Returns whether or not the user won, also can throw error if you made a mistake
 * @author CarelessInternet
 */
export async function slotMachine({
	message,
	emojis,
	embed = {}
}: {
	emojis: EmojiResolvable[];
	embed?: {
		loseMessage?: string;
	};
} & GameParameters): Promise<boolean> {
	embed.title ||= 'Slot Machine';
	embed.color ||= 'RANDOM';
	embed.winMessage ||= 'Congratulations, you won the slot machine! 🥳';
	embed.loseMessage ||= 'Unlucky, you lost at the slot machine. 😔';
	embed.footer ||= '';

	checkForNotReplied(message);

	const [name, iconURL] = tagAndAvatar(message);
	const gameEmbed = new MessageEmbed()
		.setColor(embed.color)
		.setAuthor({ name, iconURL })
		.setTitle(embed.title)
		.setTimestamp()
		.setFooter(embed.footer);

	for (const emoji of emojis) {
		if (emoji instanceof GuildEmoji && !emoji.available) {
			throw new ReferenceError(`The emoji ${emoji.id} is not available`);
		}
	}

	const slotArray = generateSlotValues(emojis);
	const resultEmbed = slotMachineAsEmbed(slotArray, gameEmbed);
	const { win, msg: description } = checkForResult(
		slotArray,
		embed.winMessage,
		embed.loseMessage
	);

	resultEmbed.setDescription(description);
	message.reply({ embeds: [resultEmbed] });

	return win;
}

function generateSlotValues(emojis: EmojiResolvable[]): EmojiResolvable[][] {
	const slotArray: EmojiResolvable[][] = [[], [], []];

	for (let i = 0; i < 3; i++) {
		for (let j = 0; j < 3; j++) {
			const randomEmoji = emojis[randomInt(emojis.length)];
			slotArray[i][j] = randomEmoji;
		}
	}

	return slotArray;
}

function slotMachineAsEmbed(
	slotArray: EmojiResolvable[][],
	embed: MessageEmbed
): MessageEmbed {
	let slotMachineString = '';

	for (let i = 0; i < slotArray.length; i++) {
		for (let j = 0; j < slotArray[i].length; j++) {
			slotMachineString += `${slotArray[i][j]} | `;
		}
		slotMachineString = slotMachineString.slice(0, -3);

		if (i === 1) {
			slotMachineString += ' ⬅️';
		}
		slotMachineString += '\n';
	}

	embed.addField('Result:', slotMachineString);
	return embed;
}

function checkForResult(
	slotArray: EmojiResolvable[][],
	winMessage: string,
	loseMessage: string
): { win: boolean; msg: string } {
	const win =
		slotArray[1][0] === slotArray[1][1] && slotArray[1][1] === slotArray[1][2];
	return {
		win,
		msg: win ? winMessage : loseMessage
	};
}
