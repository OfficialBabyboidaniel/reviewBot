# Anonymous Review Bot

A Discord bot that allows users to submit anonymous reviews and feedback.

## Features

- Submit anonymous reviews (default behavior)
- Submit named reviews with your Discord username and avatar
- View recent reviews (both anonymous and named)
- SQLite database storage
- Embedded messages for better presentation

## Commands

- `/review <message> [anonymous]` - Submit a review (anonymous defaults to true)
- `/reviews` - View the 5 most recent reviews
- `/help` - Show available commands

## Examples

- `/review message:Great service!` - Submits an anonymous review
- `/review message:Love this bot! anonymous:false` - Submits a review with your name
- `/review message:Could be better anonymous:true` - Explicitly anonymous (same as default)

## Setup

1. Install dependencies: `npm install`
2. Add your Discord bot token to `.env`
3. Run the bot: `npm start`

## Bot Permissions Needed

- Send Messages
- Manage Messages (to delete original review messages)
- Embed Links
- Read Message History

Your bot is ready to use!