const { Telegraf } = require('telegraf')
const dotenv = require('dotenv')
dotenv.config()

const bot = new Telegraf(process.env.ACCESS_TOKEN)

// ID чата
bot.on('message', ctx => {
	console.log('Chat ID:', ctx.chat.id)
})

bot.launch()
