import { readdirSync } from 'fs';
import { resolve } from 'path';
import { Client, Handler } from '../interfaces';

export const execute: Handler['execute'] = (client: Client) => {
	const loadDirectories = async (dirs: string) => {
		const files = readdirSync(resolve(__dirname, `../events/${dirs}`)).filter(
			(file) => file.endsWith('.js')
		);
		for (const file of files) {
			const event: Handler = await import(`../events/${dirs}/${file}`);
			const name = file.split('.')[0];

			if (name === 'ready') {
				client.once(name, event.execute.bind(null, client));
			} else {
				client.on(name, event.execute.bind(null, client));
			}
		}
	};

	['client', 'guild'].forEach((dir) => loadDirectories(dir));
};
