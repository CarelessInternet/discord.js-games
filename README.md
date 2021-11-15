# discord.js-games

A discord.js v13 module which allows you to add minigames to your bot super easily!

## Notable Features

* Slash commands and messages support
* Gives result of the game back
* Promise-based
* Customisable
* Easy to implement
* TypeScript support if needed for some reason

## Documentation

~~You can find it in the wiki section of the GitHub repository.~~ (will add soon, just look at the `discord-testing/commands` folder for examples)

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
      message: interaction,
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
      message: interaction,
      ...(opponent instanceof GuildMember && { opponent })
    });

    console.log('user won', result);
  }
});
```

## Issues, bugs, questions, PRs, etc

Open up an issue for anything relating to this package, that can be bugs, issues, feature requests, etc. Same goes for pull requests, feel free to submit one for improved performance, better code practices, etc.