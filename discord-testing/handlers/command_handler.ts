import { readdirSync } from 'fs';
import { resolve } from 'path';
import { Client, Command, Handler } from '../interfaces';

export const execute: Handler['execute'] = function (client: Client) {
	const files = readdirSync(resolve(__dirname, '../commands/')).filter((file) =>
		file.endsWith('.js')
	);

	files.forEach(async (file) => {
		const command: Command = await import(`../commands/${file}`);
		client.commands.set(command.data.name, command);
	});
};
