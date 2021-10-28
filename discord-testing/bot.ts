import { Intents } from 'discord.js';
import { Client, Handler } from './interfaces';

const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_VOICE_STATES
	],
	partials: ['MESSAGE', 'CHANNEL', 'GUILD_MEMBER'],
	shards: 'auto'
});

['command_handler', 'event_handler'].forEach(async (handler) => {
	const file: Handler = await import(`./handlers/${handler}`);
	file.execute(client);
});

client.login(process.env.DISCORD_BOT_TOKEN);
