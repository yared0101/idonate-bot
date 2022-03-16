const { Telegraf } = require("telegraf");
const {
    allModels,
    helpStrings,
    markups,
    isValid,
    beautifulySend,
    isAdmin,
    isLoggedIn,
    addTripSend,
    isRegistered,
    isSuperAdmin,
    sessionData,
    ngoDetail,
} = require("../../config");
const { user, confirmed, membership } = allModels;
/**
 *
 * @param {Telegraf} bot
 * @returns
 */
module.exports = async (bot) => {
    bot.command("start", async (ctx) => {
        const holder = ctx.message.text.split(" ")[1]?.split("_");
        if (holder) {
            const id = parseInt(holder[0]);
            const model = holder[1];
            console.log({ id, model });
            const donation = await allModels[model].findUnique({
                where: { id },
                include: { ngo: true },
            });
            if (await isAdmin(ctx)) {
                ctx.reply(
                    `this post's button has been started ${donation.count} times`
                );
                const allConfirmed = await confirmed.findMany({
                    where: {
                        [model + "Id"]: donation.id,
                    },
                    include: {
                        event: true,
                        any: true,
                        membership: true,
                        fixed: true,
                        monthly: true,
                        confirmedBy: true,
                    },
                });
                sessionData[ctx.chat.id] = {
                    eventScreenshot: {
                        type: model,
                        ngo: donation.ngo,
                        allConfirmed,
                    },
                };
                await ctx.reply(
                    "please select range of report(since you're an admin)",
                    markups.chooseTimeMarkup
                );
                return;
            }
            await allModels[model].update({
                where: {
                    id: donation.id,
                },
                data: {
                    count: {
                        increment: 1,
                    },
                },
            });
            const userFormat = {
                membership: async (ctx, donation) => {
                    await ctx.reply(
                        `Application for membership for NGO ${donation.ngo.name}`
                    );
                    await ctx.reply(
                        "please fill in this form(sending file) and send it back!"
                    );
                    sessionData[ctx.chat.id] = {
                        membership: {
                            id,
                        },
                    };
                    await bot.telegram.sendChatAction(
                        ctx.chat.id,
                        "upload_document"
                    );
                    await ctx.replyWithDocument(donation.toBeSentFile);
                },
                fixed: async (ctx, donation) => {
                    await ctx.reply(
                        `Donate fixed amount ${donation.amount} birr for NGO ${donation.ngo.name}`
                    );
                    await ctx.reply(`please send ${donation.amount} birr to `);
                    await ctx.reply(
                        ngoDetail(donation.ngo),
                        markups.confirmPayment(
                            donation.id,
                            donation.amount,
                            "fixed"
                        )
                    );
                },
                monthly: async (ctx, donation) => {
                    await ctx.reply(
                        `Donate amount ${donation.amount} monthly for NGO ${donation.ngo.name}`
                    );
                    await ctx.reply(`please send ${donation.amount} to `);
                    await ctx.reply(
                        ngoDetail(donation.ngo),
                        markups.confirmPayment(
                            donation.id,
                            donation.amount,
                            "monthly"
                        )
                    );
                },
                event: async (ctx, donation) => {
                    await ctx.reply(
                        `Do you confirm you're coming to the event at ${donation.address}`,
                        markups.confirmEventMarkup(donation.id)
                    );
                },
                any: async (ctx, donation) => {
                    await ctx.reply(`how much birr are u intending to send?`);
                    sessionData[ctx.chat.id] = {
                        any: {
                            id,
                        },
                    };
                },
            };
            try {
                await bot.telegram.copyMessage(
                    ctx.chat.id,
                    `@${process.env.CHANNEL_ID}`,
                    donation.pageId,
                    {}
                );
            } catch (e) {
                console.log(e);
            }
            await userFormat[model](ctx, donation);
        } else {
            try {
                await ctx.reply(
                    "Welcome",
                    isSuperAdmin(ctx)
                        ? markups.superAdminMarkup
                        : (await isAdmin(ctx))
                        ? markups.adminMarkup
                        : (await isRegistered(ctx))
                        ? markups.goToPageMarkup
                        : markups.freshMarkup
                );
            } catch (e) {
                console.log(e);
                await ctx.reply("something went wrong");
            }
        }
    });
};
