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
    parseUsersIntoString,
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
            const donation = await allModels[model].findUnique({
                where: { id },
                include: { ngo: true },
            });
            if (await isAdmin(ctx)) {
                ctx.reply(
                    `this post's button has been pressed ${donation.count} times`
                );
                const countPeople = donation.countPeople;
                if (countPeople.length) {
                    const users = await allModels.user.findMany({
                        where: {
                            OR: countPeople.map((elem) => ({
                                telegramId: elem,
                            })),
                        },
                    });
                    console.log({
                        OR: countPeople.map((elem) => ({
                            telegramId: elem,
                        })),
                    });
                    console.log({ users });
                    await ctx.reply(
                        "the people who have pressed the post are as follows" +
                            `\n${parseUsersIntoString(users)}
                            `,
                        { parse_mode: "HTML" }
                    );
                }
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
                if (allConfirmed.length) {
                    await ctx.reply(
                        "the people who have confirmed the post are as follows" +
                            `\n${parseUsersIntoString(
                                allConfirmed.map((elem) => elem.confirmedBy)
                            )}
                            `,
                        { parse_mode: "HTML" }
                    );
                }
                sessionData[ctx.chat.id] = {
                    eventScreenshot: {
                        type:
                            model == "fixed" ||
                            model == "any" ||
                            model == "monthly"
                                ? "money"
                                : model == "membership"
                                ? "screenshot"
                                : model === "",
                        ngo: donation.ngo.name,
                        allConfirmed,
                        fromStart: true,
                    },
                };
                await ctx.reply(
                    "please select report type(since you're an admin)",
                    markups.typeOfReportMarkup(model)
                );
                return;
            }
            //check if user is registered, if not register them!
            await user.upsert({
                where: {
                    telegramId: ctx.chat.id,
                },
                update: {
                    name: ctx.chat.first_name,
                    tgUsername: ctx.chat.username,
                },
                create: {
                    name: ctx.chat.first_name,
                    tgUsername: ctx.chat.username,
                    telegramId: ctx.chat.id,
                },
            });
            const countModel = await allModels[model].findUnique({
                where: {
                    id: donation.id,
                },
            });
            let countPeople = countModel.countPeople;
            const userExists = countPeople.find((elem) => elem === ctx.chat.id);
            if (!userExists) {
                countPeople.push(ctx.chat.id);
                await allModels[model].update({
                    where: {
                        id: donation.id,
                    },
                    data: {
                        count: {
                            increment: 1,
                        },
                        countPeople,
                    },
                });
            }
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
                    await ctx.reply(`How much do you want to donate?`);
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
