// Discord Bot Main File
require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const db = require('./db');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Define slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('review')
        .setDescription('Submit a review')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Your review message')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName('anonymous')
                .setDescription('Submit anonymously (default: true)')
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName('reviews')
        .setDescription('View recent reviews'),
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show bot commands and help')
].map(command => command.toJSON());

// Register slash commands
async function registerCommands() {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        console.log('Started refreshing application (/) commands.');

        // Your bot's client ID
        const clientId = '1460365779642875904';

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await registerCommands();
});

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'review') {
        const reviewContent = interaction.options.getString('message');
        const isAnonymous = interaction.options.getBoolean('anonymous') ?? true; // Default to true

        try {
            // Store in database with anonymity flag
            db.insertReview.run(interaction.user.id, reviewContent, isAnonymous ? 1 : 0);

            // Create embed based on anonymity setting
            const embed = {
                color: isAnonymous ? 0x0099ff : 0x00ff99,
                title: isAnonymous ? '📝 Anonymous Review' : '📝 Review',
                description: reviewContent,
                timestamp: new Date(),
                footer: {
                    text: isAnonymous ? 'Anonymous Review System' : 'Review System'
                }
            };

            // Add author field if not anonymous
            if (!isAnonymous) {
                embed.author = {
                    name: interaction.user.displayName || interaction.user.username,
                    iconURL: interaction.user.displayAvatarURL()
                };
            }

            const confirmMessage = isAnonymous ?
                'Your anonymous review has been submitted!' :
                'Your review has been submitted with your name!';

            await interaction.reply({ content: confirmMessage, ephemeral: true });
            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error saving review:', error);
            await interaction.reply({ content: 'Sorry, there was an error saving your review.', ephemeral: true });
        }
    }

    if (commandName === 'reviews') {
        try {
            const reviews = db.getReviews.all().slice(0, 5); // Get last 5 reviews

            if (reviews.length === 0) {
                return await interaction.reply({ content: 'No reviews found!', ephemeral: true });
            }

            const embed = {
                color: 0x00ff00,
                title: '📋 Recent Reviews',
                fields: reviews.map((review, index) => {
                    const reviewType = review.is_anonymous ? '🔒 Anonymous' : '👤 Named';
                    return {
                        name: `${reviewType} Review #${reviews.length - index}`,
                        value: review.content.substring(0, 200) + (review.content.length > 200 ? '...' : ''),
                        inline: false
                    };
                }),
                timestamp: new Date()
            };

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching reviews:', error);
            await interaction.reply({ content: 'Sorry, there was an error fetching reviews.', ephemeral: true });
        }
    }

    if (commandName === 'help') {
        const embed = {
            color: 0xffff00,
            title: '🤖 Review Bot Help',
            fields: [
                {
                    name: '/review <message> [anonymous]',
                    value: 'Submit a review. Set anonymous to false to show your name (default: true)',
                    inline: false
                },
                {
                    name: '/reviews',
                    value: 'View recent reviews (both anonymous and named)',
                    inline: false
                },
                {
                    name: '/help',
                    value: 'Show this help message',
                    inline: false
                }
            ],
            description: '**Examples:**\n`/review message:Great service!` - Anonymous review\n`/review message:Love it! anonymous:false` - Named review'
        };

        await interaction.reply({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);