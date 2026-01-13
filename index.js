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
        .addIntegerOption(option =>
            option.setName('rating')
                .setDescription('Star rating (1-5 stars)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5)
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
        .setName('summary')
        .setDescription('View overall review summary with average rating'),
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
        const rating = interaction.options.getInteger('rating');
        const isAnonymous = interaction.options.getBoolean('anonymous') ?? true; // Default to true

        // Convert rating to star emojis
        const starEmojis = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

        try {
            // Store in database with rating
            db.insertReview.run(interaction.user.id, reviewContent, rating, isAnonymous ? 1 : 0);

            // Create embed based on anonymity setting
            const embed = {
                color: isAnonymous ? 0x0099ff : 0x00ff99,
                title: isAnonymous ? '📝 Anonymous Review' : '📝 Review',
                description: reviewContent,
                fields: [
                    {
                        name: 'Rating',
                        value: `${starEmojis} (${rating}/5)`,
                        inline: true
                    }
                ],
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
                `Your anonymous ${rating}-star review has been submitted!` :
                `Your ${rating}-star review has been submitted with your name!`;

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
                    const starEmojis = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                    return {
                        name: `${reviewType} Review #${reviews.length - index}`,
                        value: `${starEmojis} (${review.rating}/5)\n${review.content.substring(0, 150) + (review.content.length > 150 ? '...' : '')}`,
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

    if (commandName === 'summary') {
        try {
            const allReviews = db.getReviews.all();

            if (allReviews.length === 0) {
                return await interaction.reply({ content: 'No reviews found to summarize!', ephemeral: true });
            }

            // Calculate statistics
            const totalReviews = allReviews.length;
            const averageRating = (allReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1);
            const ratingCounts = [1, 2, 3, 4, 5].map(star =>
                allReviews.filter(review => review.rating === star).length
            );

            // Create rating distribution
            const ratingDistribution = ratingCounts.map((count, index) => {
                const star = index + 1;
                const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                const barLength = Math.round(percentage / 5); // Scale bar to 20 chars max
                const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
                return `${star}⭐ ${bar} ${count} (${percentage}%)`;
            }).reverse(); // Show 5 stars first

            const averageStars = '⭐'.repeat(Math.floor(averageRating)) +
                (averageRating % 1 >= 0.5 ? '⭐' : '☆').repeat(Math.ceil(averageRating) - Math.floor(averageRating)) +
                '☆'.repeat(5 - Math.ceil(averageRating));

            const embed = {
                color: 0xffd700,
                title: '📊 Review Summary',
                fields: [
                    {
                        name: 'Overall Rating',
                        value: `${averageStars}\n**${averageRating}/5** (${totalReviews} reviews)`,
                        inline: false
                    },
                    {
                        name: 'Rating Distribution',
                        value: '```\n' + ratingDistribution.join('\n') + '\n```',
                        inline: false
                    }
                ],
                timestamp: new Date(),
                footer: {
                    text: 'Review Statistics'
                }
            };

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error generating summary:', error);
            await interaction.reply({ content: 'Sorry, there was an error generating the summary.', ephemeral: true });
        }
    }

    if (commandName === 'help') {
        const embed = {
            color: 0xffff00,
            title: '🤖 Review Bot Help',
            fields: [
                {
                    name: '/review <message> <rating> [anonymous]',
                    value: 'Submit a review with 1-5 star rating. Set anonymous to false to show your name (default: true)',
                    inline: false
                },
                {
                    name: '/reviews',
                    value: 'View recent reviews with ratings',
                    inline: false
                },
                {
                    name: '/summary',
                    value: 'View overall review summary with average rating and distribution',
                    inline: false
                },
                {
                    name: '/help',
                    value: 'Show this help message',
                    inline: false
                }
            ],
            description: '**Examples:**\n`/review message:Great service! rating:5` - Anonymous 5-star review\n`/review message:Good but could improve rating:3 anonymous:false` - Named 3-star review'
        };

        await interaction.reply({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);