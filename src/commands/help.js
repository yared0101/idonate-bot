const { Telegraf } = require("telegraf");
const { helpStrings } = require("../../config");
/**
 *
 * @param {Telegraf} bot
 * @returns
 */
module.exports = (bot) => {
    bot.command("help", async (ctx) => {
        await ctx.reply(`
this are the list of all the commands
Admin
    /addpost
    /addadmin
user
    /register
        `);
    });
};
