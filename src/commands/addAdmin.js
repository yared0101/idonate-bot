const { Telegraf } = require("telegraf");
const { isAdmin, allModels } = require("../../config");
const { user } = allModels;
/**
 *
 * @param {Telegraf} bot
 * @returns
 */
module.exports = (bot) => {
    bot.command("addadmin", async (ctx) => {
        try {
            if (!(await isAdmin(ctx))) {
                ctx.reply("you are not an admin");
                return;
            }
            let username = ctx.message.text.split(" ")[1];
            if (!username || username[0] != "@") {
                await ctx.reply("please send like /addadmin @username");
                return;
            }
            username = username.split("");
            username.shift();
            username = username.join("");
            const newAdmin = await user.findFirst({
                where: {
                    tgUsername: { equals: username, mode: "insensitive" },
                },
            });
            if (newAdmin) {
                await user.update({
                    where: {
                        id: newAdmin.id,
                    },
                    data: {
                        isAdmin: true,
                    },
                });
                await ctx.reply(
                    `${newAdmin.name}(@${username}) is now an admin`
                );
                await bot.telegram.sendMessage(
                    newAdmin.telegramId,
                    "You are now an admin"
                );
            } else {
                console.log(username);
                await ctx.reply(
                    "sorry user isn't registered, please tell the user to start the bot"
                );
            }
        } catch (e) {
            console.log(e);
            await ctx.reply("something went wrong");
        }
    });
};
