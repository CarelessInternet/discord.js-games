import { resolve } from 'path';
import { readdir } from 'fs/promises';
import { Command } from './interfaces';

(async () => {
	const commands = await (
		await readdir(resolve(__dirname, './commands/'))
	).filter((file) => file.endsWith('.js'));

	commands.forEach(async (file, i) => {
		const command: Command = await import(`./commands/${file}`);

		if (!command.data?.name) {
			throw new SyntaxError(
				`Missing a name property for the command file: ${commands[i]}.ts`
			);
		}
		if (!command.category) {
			throw new SyntaxError(
				`Missing a category for the command: ${commands[i]}`
			);
		}
		if (!command.execute) {
			throw new SyntaxError(
				`Missing the execution function for the command: ${command.data.name} (${command.category})`
			);
		}

		console.log(
			`✅ Successfully loaded the command: ${command.data.name} (${command.category})`
		);
	});
})();
