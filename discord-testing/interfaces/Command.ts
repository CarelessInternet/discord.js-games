import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Client } from './index';

export interface Command {
	execute: ({
		client,
		interaction,
		cmd
	}: {
		client: Client;
		interaction: CommandInteraction;
		cmd: string;
	}) => Promise<void> | void;
	data: SlashCommandBuilder;
	category: 'Games' | 'Utility';
}
