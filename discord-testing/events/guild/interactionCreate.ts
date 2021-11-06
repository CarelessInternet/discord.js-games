import { Interaction } from 'discord.js';
import { Client } from '../../interfaces';

export const execute = (client: Client, interaction: Interaction) => {
	if (!interaction.isCommand()) return;

	const cmd = interaction.commandName;
	const command = client.commands.get(cmd);

	if (!command) return;

	command.execute({ client, interaction, cmd });
};
