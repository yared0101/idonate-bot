const { Telegraf } = require("telegraf");
const { isAdmin, allModels, markups, sessionData } = require("../../config");
const { user, ngo } = allModels;
/**
 *
 * @param {Telegraf} bot
 * @returns
 */
module.exports = (bot) => {
    bot.command("addpost", async (ctx) => {
        try {
            if (!(await isAdmin(ctx))) {
                ctx.reply("you are not an admin");
                return;
            }
            const type = ctx.message.text.split(" ")[1];
            const types = ["membership", "fixed", "monthly", "event", "any"];
            if (!type || types.indexOf(type) == -1) {
                await ctx.reply(
                    "please send like \n/addpost type\n format \ntype can only be one of membership, fixed, monthly, event, or any"
                );
                return;
            }
            sessionData[ctx.chat.id] = {
                addTrip: {
                    type,
                    posterPictures: "",
                },
            };
            const ngos = await ngo.findMany({ select: { name: true } });
            ngos.length
                ? await ctx.reply(
                      `please send ngo name from\n${ngos.map(
                          (elem, index) => `${index + 1}. ${elem.name}`
                      )}`
                  )
                : await ctx.reply("please press /addngo to add ngos first");
        } catch {
            await ctx.reply("something went wrong");
        }
    });
};
