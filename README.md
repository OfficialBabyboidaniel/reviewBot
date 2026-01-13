# Anonymous Review Bot

A Discord bot that allows users to submit anonymous reviews and feedback.

## Features

- Submit anonymous or named reviews with 1-5 star ratings
- View recent reviews with star ratings displayed
- Overall review summary with average rating and distribution chart
- SQLite database storage
- Embedded messages with star emojis

## Commands

- `/review <message> <rating> [anonymous]` - Submit a review with star rating (1-5)
- `/reviews` - View the 5 most recent reviews with ratings
- `/summary` - View overall review statistics and rating distribution
- `/help` - Show available commands

## Examples

- `/review message:Great service! rating:5` - Anonymous 5-star review
- `/review message:Good experience rating:4 anonymous:false` - Named 4-star review
- `/review message:Could be better rating:2 anonymous:true` - Anonymous 2-star review
- `/summary` - Shows average rating and distribution chart

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