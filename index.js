const fs = require('node:fs');
const path = require('node:path');
const { Configuration, OpenAIApi } = require('openai');
const { Client, Collection, GatewayIntentBits, ActivityType, channelLink } = require('discord.js');

require('dotenv').config()

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}


const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
    organization:  process.env.OPENAI_ORG
});

var prompt = {};
const openai = new OpenAIApi(configuration);

client.on('ready', async function () {
    console.log(`Logged in as ${client.user.tag}!`);
    
    var allGuilds = client.guilds;
    allGuilds.cache.map(function (guild) {
        prompt[guild.id] = '';
    });

    client.user.setPresence({
        activities: [{
            name: 'to -chat',
            emoji: {
                name: '🤖',
                id: null
            },
            type: ActivityType.Listening
        }],
        status: 'online'
    });
    
    console.log('bot status', client.user.presence);
    // Change precense
    
});


client.on('messageCreate', async function (message) {
    const guild = message.guild;

    try {
        if (message.author.bot) return;

        // Only respond to messages that start with !chat
        if (!message.content.startsWith('-chat')) return;

        // If message starts with !chat, then remove it and continue
        message.content = message.content.replace('-chat', '');

        // Strip the message of any extra spaces
        message.content = message.content.trim();

        // Log user name 
        console.log(message.author.username);

        prompt[guild.id] += `${message.content}\n`;
        
        // Prompt has to be less than 512 characters, so we need to truncate it
        if (prompt[guild.id].length > 900) {

           // truncate the prompt to 512 characters from start
            // First, we need to split the string by '\n', then we need to remove the first element
            // until the string is less than 512 characters
            while (prompt[guild.id].length > 900) {
                prompt[guild.id] = prompt[guild.id].split('\n').slice(1).join('\n');
            }
            console.log('prompt truncated');
        }

        const gptPrompt = "你是一个擅长帮人写作业的人，上知天文下知地理。\n" + prompt[guild.id];
        
        await message.channel.sendTyping();
        const gptResponse = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: gptPrompt,
            temperature: 0.7,
            frequency_penalty: 0.5,
            max_tokens: 1000,
        });

        // console.log(message.content);
        prompt[guild.id] += `${gptResponse.data.choices[0].text}\n`;
        message.reply(gptResponse.data.choices[0].text);
        return;

    } catch (error) {
        console.log(error);
        // Output basic error info to the user
        message.reply('Sorry, I had an error. Please try again.');
        // Output error code
        message.reply(error);
    }
});

client.login(process.env.DISCORD_TOKEN);
console.log('Bot is running');
