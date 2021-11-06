import {
	CommandInteraction,
	Message,
	MessageEmbed,
	NewsChannel,
	TextBasedChannels,
	TextChannel,
	ThreadChannel
} from 'discord.js';
import { inlineCode } from '@discordjs/builders';

export function checkForPermissions(
	message: Message | CommandInteraction,
	channel: TextBasedChannels | null,
	tag: string,
	avatar: string
): void {
	// usually a channel is always included, if it isn't, it's most likely due to missing partials like in dm channels
	if (!channel) {
		throw new TypeError(
			'Missing a channel, did you forget to include partials?'
		);
	}

	// if it's not a dm channel, check for sufficient permissions
	if (
		channel instanceof TextChannel ||
		channel instanceof NewsChannel ||
		channel instanceof ThreadChannel
	) {
		const perms = channel.permissionsFor(message.guild?.me ?? '');

		if (!perms?.has('ADD_REACTIONS')) {
			const embed = new MessageEmbed()
				.setColor('DARK_RED')
				.setAuthor(tag, avatar)
				.setTitle('Missing Permissions')
				.setDescription(
					`❌ I am missing the ${inlineCode(
						'Add Reactions'
					)} permission, please give it to me before using this command`
				)
				.setTimestamp();

			message.reply({ embeds: [embed] });
			return;
		}
		if (!perms?.has('SEND_MESSAGES')) {
			return;
		}
	}
}
