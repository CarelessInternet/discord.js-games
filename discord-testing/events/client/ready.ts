import { Client, Handler } from '../../interfaces';

export const execute: Handler['execute'] = function (client: Client) {
	client.user?.setActivity('some games', { type: 'PLAYING' });
	console.log(`Logged in as ${client.user?.tag}`);
};
