import { Message } from 'discord.js';
import { Client } from '../../interfaces';

export const execute = (client: Client, message: Message) => {
	const prefix = '-';

	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	const cmd = args.shift()?.toLowerCase() ?? '';
	const command = client.commands.get(cmd);

	if (!command) {
		message.reply({ content: 'Please choose a valid command' });
		return;
	}

	command.execute({ client, cmd, args, interaction: message });
};
