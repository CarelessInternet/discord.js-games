import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, Message } from 'discord.js';
import { Client } from './index';

export interface Command {
	execute: ({
		client,
		interaction,
		cmd
	}: {
		client: Client;
		interaction: Message | CommandInteraction;
		cmd: string;
	}) => Promise<void> | void;
	data:
		| Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
		| SlashCommandBuilder;
	category: 'Games' | 'Utility';
}
