import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { readdirSync } from 'fs';
import { config } from 'dotenv';
import { resolve } from 'path';

config();

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
	try {
		console.log('Started refreshing application (/) commands');

		const files = readdirSync(resolve(__dirname, './commands/')).filter(
			(file) => file.endsWith('js')
		);
		const commands = await files.reduce(
			async (acc: Promise<string[]>, file: string) => {
				const command = await import(`./commands/${file}`);
				(await acc).push(command.data.toJSON());

				return acc;
			},
			Promise.resolve([])
		);

		await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
			body: commands
		});

		console.log('Successfully reloaded application (/) commands');
	} catch (err) {
		console.error(err);
	}
})();
