// Discord Bot Huvudfil
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

// Definiera slash-kommandon
const commands = [
    new SlashCommandBuilder()
        .setName('recension')
        .setDescription('Skicka in en recension')
        .addStringOption(option =>
            option.setName('meddelande')
                .setDescription('Ditt recensionsmeddelande')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('betyg')
                .setDescription('Stjärnbetyg (1-5 stjärnor)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5)
        )
        .addBooleanOption(option =>
            option.setName('anonym')
                .setDescription('Skicka anonymt (standard: true)')
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName('recensioner')
        .setDescription('Visa senaste recensionerna'),
    new SlashCommandBuilder()
        .setName('sammanfattning')
        .setDescription('Visa övergripande recensionssammanfattning med medelbetyg'),
    new SlashCommandBuilder()
        .setName('hjälp')
        .setDescription('Visa bot-kommandon och hjälp')
].map(command => command.toJSON());

// Registrera slash-kommandon
async function registerCommands() {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        console.log('Började uppdatera applikationskommandon (/).');

        // Din bots klient-ID
        const clientId = '1460365779642875904';

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log('Uppdaterade applikationskommandon (/) framgångsrikt.');
    } catch (error) {
        console.error('Fel vid registrering av kommandon:', error);
    }
}

client.once('ready', async () => {
    console.log(`Inloggad som ${client.user.tag}!`);
    await registerCommands();
});

// Hantera slash-kommandon
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'recension') {
        const reviewContent = interaction.options.getString('meddelande');
        const rating = interaction.options.getInteger('betyg');
        const isAnonymous = interaction.options.getBoolean('anonym') ?? true; // Standard till true

        // Konvertera betyg till stjärnemojis
        const starEmojis = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

        try {
            // Spara i databas med betyg
            await db.insertReview.run(interaction.user.id, reviewContent, rating, isAnonymous ? 1 : 0);

            // Skapa embed baserat på anonymitetsinställning
            const embed = {
                color: isAnonymous ? 0x0099ff : 0x00ff99,
                title: isAnonymous ? '📝 Anonym Recension' : '📝 Recension',
                description: reviewContent,
                fields: [
                    {
                        name: 'Betyg',
                        value: `${starEmojis} (${rating}/5)`,
                        inline: true
                    }
                ],
                timestamp: new Date(),
                footer: {
                    text: isAnonymous ? 'Anonymt Recensionssystem' : 'Recensionssystem'
                }
            };

            // Lägg till författarfält om inte anonymt
            if (!isAnonymous) {
                embed.author = {
                    name: interaction.user.displayName || interaction.user.username,
                    iconURL: interaction.user.displayAvatarURL()
                };
            }

            const confirmMessage = isAnonymous ?
                `Din anonyma ${rating}-stjärniga recension har skickats in!` :
                `Din ${rating}-stjärniga recension har skickats in med ditt namn!`;

            await interaction.reply({ content: confirmMessage, ephemeral: true });
            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Fel vid sparande av recension:', error);
            await interaction.reply({ content: 'Tyvärr uppstod ett fel vid sparande av din recension.', ephemeral: true });
        }
    }

    if (commandName === 'recensioner') {
        try {
            const reviews = (await db.getReviews.all()).slice(0, 5); // Hämta senaste 5 recensionerna

            if (reviews.length === 0) {
                return await interaction.reply({ content: 'Inga recensioner hittades!', ephemeral: true });
            }

            const embed = {
                color: 0x00ff00,
                title: '📋 Senaste Recensionerna',
                fields: reviews.map((review, index) => {
                    const reviewType = review.is_anonymous ? '🔒 Anonym' : '👤 Namngiven';
                    const starEmojis = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                    return {
                        name: `${reviewType} Recension #${reviews.length - index}`,
                        value: `${starEmojis} (${review.rating}/5)\n${review.content.substring(0, 150) + (review.content.length > 150 ? '...' : '')}`,
                        inline: false
                    };
                }),
                timestamp: new Date()
            };

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Fel vid hämtning av recensioner:', error);
            await interaction.reply({ content: 'Tyvärr uppstod ett fel vid hämtning av recensioner.', ephemeral: true });
        }
    }

    if (commandName === 'sammanfattning') {
        try {
            const allReviews = await db.getReviews.all();

            if (allReviews.length === 0) {
                return await interaction.reply({ content: 'Inga recensioner hittades att sammanfatta!', ephemeral: true });
            }

            // Beräkna statistik
            const totalReviews = allReviews.length;
            const averageRating = (allReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1);
            const ratingCounts = [1, 2, 3, 4, 5].map(star =>
                allReviews.filter(review => review.rating === star).length
            );

            // Skapa betygfördelning
            const ratingDistribution = ratingCounts.map((count, index) => {
                const star = index + 1;
                const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                const barLength = Math.round(percentage / 5); // Skala stapel till max 20 tecken
                const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
                return `${star}⭐ ${bar} ${count} (${percentage}%)`;
            }).reverse(); // Visa 5 stjärnor först

            const averageStars = '⭐'.repeat(Math.floor(averageRating)) +
                (averageRating % 1 >= 0.5 ? '⭐' : '☆').repeat(Math.ceil(averageRating) - Math.floor(averageRating)) +
                '☆'.repeat(5 - Math.ceil(averageRating));

            const embed = {
                color: 0xffd700,
                title: '📊 Recensionssammanfattning',
                fields: [
                    {
                        name: 'Totalt Betyg',
                        value: `${averageStars}\n**${averageRating}/5** (${totalReviews} recensioner)`,
                        inline: false
                    },
                    {
                        name: 'Betygfördelning',
                        value: '```\n' + ratingDistribution.join('\n') + '\n```',
                        inline: false
                    }
                ],
                timestamp: new Date(),
                footer: {
                    text: 'Recensionsstatistik'
                }
            };

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Fel vid generering av sammanfattning:', error);
            await interaction.reply({ content: 'Tyvärr uppstod ett fel vid generering av sammanfattningen.', ephemeral: true });
        }
    }

    if (commandName === 'hjälp') {
        const embed = {
            color: 0xffff00,
            title: '🤖 Recensionsbot Hjälp',
            fields: [
                {
                    name: '/recension <meddelande> <betyg> [anonym]',
                    value: 'Skicka in en recension med 1-5 stjärnbetyg. Sätt anonym till false för att visa ditt namn (standard: true)',
                    inline: false
                },
                {
                    name: '/recensioner',
                    value: 'Visa senaste recensionerna med betyg',
                    inline: false
                },
                {
                    name: '/sammanfattning',
                    value: 'Visa övergripande recensionssammanfattning med medelbetyg och fördelning',
                    inline: false
                },
                {
                    name: '/hjälp',
                    value: 'Visa detta hjälpmeddelande',
                    inline: false
                }
            ],
            description: '**Exempel:**\n`/recension meddelande:Fantastisk service! betyg:5` - Anonym 5-stjärnig recension\n`/recension meddelande:Bra men kan förbättras betyg:3 anonym:false` - Namngiven 3-stjärnig recension'
        };

        await interaction.reply({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);