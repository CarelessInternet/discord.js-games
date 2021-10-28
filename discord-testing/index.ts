import { Shard, ShardingManager } from 'discord.js';
import { resolve } from 'path';
import { config } from 'dotenv';

config();

const manager = new ShardingManager(resolve(__dirname, './bot.js'), {
	token: process.env.DISCORD_BOT_TOKEN
});

manager.on('shardCreate', (shard: Shard) => {
	console.log(`Created shard #${shard.id} at ${new Date().toLocaleString()}`);
});

manager.spawn();
