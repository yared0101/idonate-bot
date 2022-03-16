const { Telegraf } = require("telegraf");
const {
    allModels,
    markups,
    sessionData,
    isRegistered,
} = require("../../config");
const { user, ngo } = allModels;
/**
 *
 * @param {Telegraf} bot
 * @returns
 */
module.exports = (bot) => {
    bot.command("register", async (ctx) => {
        try {
            if (await isRegistered(ctx)) {
                ctx.reply("you are already registered, no need");
                return;
            }
            sessionData[ctx.chat.id] = {
                register: {
                    telegramId: ctx.chat.id,
                    name: ctx.chat.first_name,
                    tgUsername: ctx.chat.username,
                },
            };
            await ctx.reply("please send phone number", markups.sharePhone);
        } catch {
            await ctx.reply("something went wrong");
        }
    });
};
