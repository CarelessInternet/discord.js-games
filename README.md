<div align="center">
  <img src="https://img.shields.io/npm/dw/discord.js-games">
  <img src="https://img.shields.io/npm/l/discord.js-games">
  <img src="https://img.shields.io/node/v/discord.js-games?color=yellow">
  <img src="https://img.shields.io/npm/v/discord.js-games">
  <img src="https://img.shields.io/github/commit-activity/m/CarelessInternet/discord.js-games?color=purple">
</div>

# discord.js-games

A discord.js v13 module which allows you to add minigames to your bot super easily!

## Notable Features

* Slash commands and messages support
* Gives result of the game back
* Promise-based
* Customisable
* Easy to implement
* TypeScript support

## Documentation

You can find it in the [wiki section](https://github.com/CarelessInternet/discord.js-games/wiki) of the [GitHub repository](https://github.com/CarelessInternet/discord.js-games).

## How to??????

### Installation

```
npm i discord.js-games
```

### Playing

#### CommonJS Example
```js
const { GuildMember } = require('discord.js');
const { blackjack, rps } = require('discord.js-games');

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  
  if (interaction.commandName === 'blackjack') {
    const result = await blackjack({ message: interaction });

    console.log('user won', result);
  } else if (interaction.commandName === 'rps') {
    rps({ message: interaction });
  }
});
client.on('messageCreate', async message => {
  if (message.content === 'blackjack') {
    blackjack({ message });
  } else if (message.content === 'rps') {
    const opponent = message.mentions.members?.first();
    const result = await rps({
      message,
      ...(opponent instanceof GuildMember && { opponent })
    });

    console.log('user won', result);
  }
});
```

#### ES6/TypeScript Example
```ts
import { GuildMember } from 'discord.js';
import { blackjack, rps } from 'discord.js-games';

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  
  if (interaction.commandName === 'blackjack') {
    const result = await blackjack({ message: interaction });

    console.log('user won', result);
  } else if (interaction.commandName === 'rps') {
    rps({ message: interaction });
  }
});
client.on('messageCreate', async message => {
  if (message.content === 'blackjack') {
    blackjack({ message });
  } else if (message.content === 'rps') {
    const opponent = message.mentions.members?.first();
    const result = await rps({
      message,
      ...(opponent instanceof GuildMember && { opponent })
    });

    console.log('user won', result);
  }
});
```

## Issues, bugs, questions, PRs, etc

Open up an issue for anything relating to this package, that can be bugs, issues, feature requests, etc. Same goes for pull requests, feel free to submit one for improved performance, better code practices, etc.
