const { Telegraf } = require("telegraf");
const { allModels, markups, sessionData } = require("../../config");
const { event, user } = allModels;
/**
 *
 * @param {Telegraf} bot
 */
module.exports = (bot) => {
    bot.action(/confirm.*/, async (ctx) => {
        try {
            const id = Number(ctx.match[0].split(" ")[1]);
            try {
                const confirmer =
                    (await user.findFirst({
                        where: {
                            telegramId: ctx.chat.id,
                        },
                    })) ||
                    (await user.create({
                        data: {
                            telegramId: ctx.chat.id,
                            name: ctx.chat.first_name,
                            tgUsername: ctx.chat.username,
                        },
                    }));
                console.log(confirmer);
                await event.update({
                    where: {
                        id,
                    },
                    data: {
                        confirmed: {
                            create: {
                                confirmedById: confirmer?.id,
                            },
                        },
                    },
                });
                await bot.telegram.deleteMessage(
                    ctx.chat.id,
                    ctx.update.callback_query.message.message_id
                );
                await ctx.reply(`Thanks, for confirming your attendance!`);
                if (!confirmer?.phoneNumber) {
                    sessionData[ctx.chat.id] = {
                        register: {
                            telegramId: ctx.chat.id,
                            name: ctx.chat.first_name,
                            tgUsername: ctx.chat.username,
                        },
                    };
                    await ctx.reply(
                        "We want to know more about you, please send your phone number",
                        markups.sharePhone
                    );
                }
            } catch (e) {
                console.log(e);
                await ctx.reply("something went wrong");
            }
        } catch {
            await ctx.reply("something went wrong");
        } finally {
            ctx.answerCbQuery();
        }
    });
    bot.action(/payment.*/, async (ctx) => {
        try {
            const [, model, id] = ctx.match[0].split("_");
            console.log(ctx.match[0], model, id);
            try {
                await bot.telegram.deleteMessage(
                    ctx.chat.id,
                    ctx.update.callback_query.message.message_id
                );
                await ctx.reply(
                    "Thank You! for your kindness.\nPlease send screenshot of the transaction"
                );
                sessionData[ctx.chat.id] = {
                    fixedOrMonthly: {
                        id: Number(id),
                        model,
                    },
                };
            } catch (e) {
                console.log(e);
                await ctx.reply("something went wrong");
            }
        } catch {
            await ctx.reply("something went wrong");
        } finally {
            ctx.answerCbQuery();
        }
    });
};
