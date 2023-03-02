const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Talk to the bot'),
    async execute(interaction) {
        await interaction.reply('Pong!' + interaction.user.username);
    },
};
