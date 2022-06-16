const { Telegraf } = require("telegraf");
const {
    helpStrings,
    sessionData,
    isLoggedIn,
    isValid,
    isAdmin,
    markups,
    allModels,
    addTripSend,
    isSuperAdmin,
    ngoDetail,
    isRegistered,
    parseUsersIntoString,
} = require("../../config");
const { user, ngo, confirmed } = allModels;
/**
 *
 * @param {Telegraf} bot
 * @returns
 */
module.exports = async (bot) => {
    bot.hears(helpStrings.addPost, async (ctx) => {
        try {
            if (!(await isAdmin(ctx))) {
                ctx.reply("you are not an admin");
                return;
            }
            sessionData[ctx.chat.id] = {
                addTrip: {
                    type: undefined,
                    posterPictures: "",
                },
            };
            await ctx.reply(
                "please select one of the types",
                markups.chooseTypeMarkup
            );
        } catch {
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(
        [
            helpStrings.membership,
            helpStrings.event,
            helpStrings.any,
            helpStrings.monthly,
            helpStrings.fixed,
        ],
        async (ctx, next) => {
            if (
                sessionData[ctx.chat.id]?.addTrip &&
                !sessionData[ctx.chat.id]?.addTrip?.type
            ) {
                sessionData[ctx.chat.id].addTrip.type =
                    ctx.message.text === helpStrings.membership
                        ? "membership"
                        : ctx.message.text === helpStrings.event
                        ? "event"
                        : ctx.message.text === helpStrings.fixed
                        ? "fixed"
                        : ctx.message.text === helpStrings.any
                        ? "any"
                        : "monthly";

                const ngos = await allModels.ngo.findMany({
                    select: { name: true },
                });
                if (ngos.length) {
                    sessionData[ctx.chat.id].addTrip.ngolist = ngos;
                    await ctx.reply(
                        `please send ngo number from${ngos.map(
                            (elem, index) => `\n${index + 1}. ${elem.name}`
                        )}`
                    );
                } else {
                    delete sessionData[ctx.chat.id].addTrip;
                    await ctx.reply(
                        `please press ${helpStrings.addNgo} to add ngos first`,
                        isSuperAdmin(ctx)
                            ? markups.superAdminMarkup
                            : markups.adminMarkup
                    );
                }
            } else {
                next();
            }
        }
    );
    bot.hears(helpStrings.addAdmin, async (ctx) => {
        if (!isSuperAdmin(ctx)) {
            next();
        }
        try {
            sessionData[ctx.chat.id] = {
                addAdmin: {
                    changeId: "",
                },
            };
            await ctx.reply("please send user's username");
        } catch {
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.addNgo, async (ctx, next) => {
        if (!(await isAdmin(ctx))) {
            next();
        }
        try {
            sessionData[ctx.chat.id] = {
                addNgo: {},
            };
            await ctx.reply("please send NGO name");
        } catch {
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.removeAdmin, async (ctx) => {
        if (!isSuperAdmin(ctx)) {
            next();
        }
        try {
            const admins = await user.findMany({
                where: { isAdmin: true },
                orderBy: { id: "asc" },
            });
            if (admins.length) {
                sessionData[ctx.chat.id] = {
                    removeAdmin: admins,
                };
                await ctx.reply(
                    `please type number of the person u wanna remove${admins.map(
                        (admin1, index) =>
                            `\n${index + 1}. <a href="tg://user?id=${
                                admin1.telegramId
                            }">${admin1.name}</a>`
                    )}`,
                    { parse_mode: "HTML" }
                );
            } else {
                await ctx.reply(`no one is an admin yet`, {
                    parse_mode: "HTML",
                });
            }
        } catch {
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.editNgo, async (ctx) => {
        if (!(await isAdmin(ctx))) {
            next();
        }
        try {
            const ngos = await ngo.findMany();
            if (ngos.length) {
                sessionData[ctx.chat.id] = {
                    editNgo: ngos,
                };
                await ctx.reply(
                    `Please choose number from${ngos.map(
                        (elem, index) => `\n${index + 1}. ${elem.name}`
                    )}`
                );
            } else {
                await ctx.reply(
                    `please press ${helpStrings.addNgo} to add ngos first`,
                    markups.adminMarkup
                );
            }
        } catch {
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.seeAdmins, async (ctx) => {
        if (!isSuperAdmin(ctx)) {
            next();
        }
        try {
            const admins = await user.findMany({
                where: { isAdmin: true },
                orderBy: { id: "asc" },
            });
            if (admins.length) {
                sessionData[ctx.chat.id] = {
                    removeAdmin: admins,
                };
                await ctx.reply(
                    `here you go${admins.map(
                        (admin1, index) =>
                            `\n${index + 1}. <a href="tg://user?id=${
                                admin1.telegramId
                            }">${admin1.name}</a>`
                    )}`,
                    { parse_mode: "HTML" }
                );
            } else {
                await ctx.reply(`no one is an admin yet`, {
                    parse_mode: "HTML",
                });
            }
        } catch {
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.getAdPost, async (ctx) => {
        if (!(await isAdmin(ctx))) {
            next();
        }
        try {
            await ctx.replyWithPhoto(
                "AgACAgQAAxkBAAIbv2KoRMIDujnxRxc2f-oj44XAqQKoAAInuzEbr9lBUa1BzJ6F-CDYAQADAgADeAADJAQ",
                {
                    caption:
                        "Do you want to help someone but don't know how? There is a new way for you to make a big impact and it's easy. With iDonate, people who need medical treatment, food, clothes get a chance for a better life. Now it's more convenient than ever to access the good as well. Obtain everyone with just a few clicks.",
                    ...markups.advertisementMarkup,
                }
            );
        } catch {
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.seeNgos, async (ctx) => {
        if (!(await isAdmin(ctx))) {
            next();
        }
        try {
            const ngos = await ngo.findMany();
            ngos.length;
            if (ngos.length) {
                await ctx.reply("Here you go");
                for (let i in ngos) {
                    const ngo1 = ngos[i];
                    await ctx.reply(ngoDetail(ngo1, i));
                }
            } else {
                await ctx.reply(
                    `please press ${helpStrings.addNgo} to add ngos first`,
                    markups.adminMarkup
                );
            }
        } catch (e) {
            console.log(e);
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.seeUsers, async (ctx) => {
        if (!(await isAdmin(ctx))) {
            next();
        }
        try {
            const users = await user.findMany({ where: { isAdmin: false } });
            if (users.length) {
                await ctx.reply(`Here you go\n${parseUsersIntoString(users)}`, {
                    parse_mode: "HTML",
                });
            } else {
                await ctx.reply(
                    `no non-admin users registered`,
                    markups.adminMarkup
                );
            }
        } catch (e) {
            console.log(e);
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.register, async (ctx) => {
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
        } catch (e) {
            console.log(e);
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(
        [
            helpStrings.getScreenshots,
            helpStrings.getEvents,
            helpStrings.getForms,
            helpStrings.getAll,
            helpStrings.getMoney,
        ],
        async (ctx) => {
            try {
                if (sessionData[ctx.chat.id]?.eventScreenshot?.fromStart) {
                    delete sessionData[ctx.chat.id].eventScreenshot.fromStart;
                    sessionData[ctx.chat.id].eventScreenshot.type =
                        ctx.message.text === helpStrings.getScreenshots
                            ? "screenshot"
                            : ctx.message.text === helpStrings.getEvents
                            ? "event"
                            : ctx.message.text === helpStrings.getMoney
                            ? "money"
                            : ctx.message.text === helpStrings.getForms
                            ? "form"
                            : "all";
                    await ctx.reply(
                        "please select range of report",
                        markups.chooseTimeMarkup
                    );
                    return;
                }
                sessionData[ctx.chat.id] = {
                    eventScreenshot: {
                        type:
                            ctx.message.text === helpStrings.getScreenshots
                                ? "screenshot"
                                : ctx.message.text === helpStrings.getEvents
                                ? "event"
                                : ctx.message.text === helpStrings.getMoney
                                ? "money"
                                : ctx.message.text === helpStrings.getForms
                                ? "form"
                                : "all",
                    },
                };
                const ngos = await allModels.ngo.findMany({
                    select: { name: true },
                });
                if (ngos.length) {
                    sessionData[ctx.chat.id].eventScreenshot.ngolist = ngos;
                    await ctx.reply(
                        `please send ngo number from${ngos.map(
                            (elem, index) => `\n${index + 1}. ${elem.name}`
                        )}\n${ngos.length + 1}. All
                        `
                    );
                    // if (ctx.message.text === helpStrings.getMoney) {
                    // } else {
                    //     await ctx.reply(
                    //         `please send ngo number from${ngos.map(
                    //             (elem, index) => `\n${index + 1}. ${elem.name}`
                    //         )}
                    //         `
                    //     );
                    // }
                } else {
                    delete sessionData[ctx.chat.id].eventScreenshot;
                    await ctx.reply(
                        `please press ${helpStrings.addNgo} to add ngos first`,
                        isSuperAdmin(ctx)
                            ? markups.superAdminMarkup
                            : markups.adminMarkup
                    );
                }
            } catch {
                await ctx.reply("something went wrong");
            }
        }
    );
    bot.hears(
        [
            helpStrings.byDay,
            helpStrings.byMonth,
            helpStrings.byWeek,
            helpStrings.home,
        ],
        async (ctx, next) => {
            try {
                if (!sessionData[ctx.chat.id]?.eventScreenshot.ngo) {
                    next();
                    return;
                }
                const byDay = ctx.message.text === helpStrings.byDay;
                const byMonth = ctx.message.text === helpStrings.byMonth;
                const byWeek = ctx.message.text === helpStrings.byWeek;
                const home = ctx.message.text === helpStrings.home;
                if (home) {
                    delete sessionData[ctx.chat.id];
                    next();
                    return;
                }
                let filtertime = new Date();
                byDay
                    ? filtertime.setDate(filtertime.getDate() - 7)
                    : byWeek
                    ? filtertime.setMonth(filtertime.getMonth() - 1)
                    : filtertime.setFullYear(filtertime.getFullYear() - 1);
                const allConfirmedWithoutNgo = await confirmed.findMany({
                    where: {
                        createdTime: {
                            lt: new Date(),
                            gt: filtertime,
                        },
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
                const allConfirmed =
                    sessionData[ctx.chat.id]?.eventScreenshot.allConfirmed ||
                    allConfirmedWithoutNgo.filter(
                        ({ event, any, membership, fixed, monthly }) => {
                            if (event) {
                                return (
                                    event.ngoName ===
                                    sessionData[ctx.chat.id]?.eventScreenshot
                                        .ngo
                                );
                            } else if (any) {
                                return (
                                    any.ngoName ===
                                    sessionData[ctx.chat.id]?.eventScreenshot
                                        .ngo
                                );
                            } else if (membership) {
                                return (
                                    membership.ngoName ===
                                    sessionData[ctx.chat.id]?.eventScreenshot
                                        .ngo
                                );
                            } else if (fixed) {
                                return (
                                    fixed.ngoName ===
                                    sessionData[ctx.chat.id]?.eventScreenshot
                                        .ngo
                                );
                            } else if (monthly) {
                                return (
                                    monthly.ngoName ===
                                    sessionData[ctx.chat.id]?.eventScreenshot
                                        .ngo
                                );
                            } else {
                                return false;
                            }
                        }
                    );
                if (sessionData[ctx.chat.id]?.eventScreenshot.type == "event") {
                    let currentFil = new Date();
                    let filtered = [];
                    const compareNumber = byDay ? 7 : byWeek ? 4 : 12;
                    for (let index = 1; index <= compareNumber; index += 1) {
                        let now = new Date();
                        const ltDate = new Date(currentFil);
                        if (byDay) {
                            now.setDate(now.getDate() - index);
                        } else if (byWeek) {
                            now.setDate(now.getDate() - index * 7);
                        } else {
                            now.setMonth(now.getMonth() - index);
                        }
                        const gtDate = new Date(now);
                        currentFil = new Date(now);
                        filtered.push({
                            from: gtDate,
                            to: ltDate,
                            events: allConfirmed.filter(
                                ({ createdTime, eventId }) =>
                                    createdTime < ltDate &&
                                    createdTime >= gtDate &&
                                    eventId
                            ),
                        });
                    }
                    for (let i in filtered) {
                        const display = filtered[i];
                        await ctx.reply(
                            `last ${
                                byDay ? "day" : byWeek ? "week" : "month"
                            } up to ${display.to.toDateString()}`
                        );
                        await ctx.reply(
                            `there have been ${display.events.length} event cofirmations`
                        );
                    }
                } else if (
                    sessionData[ctx.chat.id]?.eventScreenshot.type ==
                    "screenshot"
                ) {
                    let currentFil = new Date();
                    let filtered = [];
                    const compareNumber = byDay ? 7 : byWeek ? 4 : 12;
                    for (let index = 1; index <= compareNumber; index += 1) {
                        let now = new Date();
                        const ltDate = new Date(currentFil);
                        if (byDay) {
                            now.setDate(now.getDate() - index);
                        } else if (byWeek) {
                            now.setDate(now.getDate() - index * 7);
                        } else {
                            now.setMonth(now.getMonth() - index);
                        }
                        const gtDate = new Date(now);
                        currentFil = new Date(now);
                        filtered.push({
                            from: gtDate,
                            to: ltDate,
                            screenshots: allConfirmed.filter(
                                ({
                                    createdTime,
                                    membershipId,
                                    anyId,
                                    monthlyId,
                                    fixedId,
                                }) =>
                                    createdTime < ltDate &&
                                    createdTime >= gtDate &&
                                    (membershipId ||
                                        anyId ||
                                        monthlyId ||
                                        fixedId)
                            ),
                        });
                    }
                    for (let i in filtered) {
                        const display = filtered[i];
                        await ctx.reply(
                            `last ${
                                byDay ? "day" : byWeek ? "week" : "month"
                            } up to ${display.to.toDateString()}`
                        );
                        for (let k in display.screenshots) {
                            const screenshot = display.screenshots[k];
                            await ctx.replyWithPhoto(screenshot.screenshot, {
                                caption: `From user <a href="tg://user?id=${screenshot?.confirmedBy?.telegramId}">${screenshot?.confirmedBy?.name}</a>`,
                                parse_mode: "HTML",
                            });
                        }
                        await ctx.reply(
                            `this ${
                                byDay ? "day" : byWeek ? "week" : "month"
                            } total = ${
                                display.screenshots.length
                            } screenshots\n------------------------------------------`
                        );
                    }
                } else if (
                    sessionData[ctx.chat.id]?.eventScreenshot.type == "form"
                ) {
                    let currentFil = new Date();
                    let filtered = [];
                    const compareNumber = byDay ? 7 : byWeek ? 4 : 12;
                    for (let index = 1; index <= compareNumber; index += 1) {
                        let now = new Date();
                        const ltDate = new Date(currentFil);
                        if (byDay) {
                            now.setDate(now.getDate() - index);
                        } else if (byWeek) {
                            now.setDate(now.getDate() - index * 7);
                        } else {
                            now.setMonth(now.getMonth() - index);
                        }
                        const gtDate = new Date(now);
                        currentFil = new Date(now);
                        filtered.push({
                            from: gtDate,
                            to: ltDate,
                            screenshots: allConfirmed.filter(
                                ({
                                    createdTime,
                                    membershipId,
                                    membershipFile,
                                }) =>
                                    createdTime < ltDate &&
                                    createdTime >= gtDate &&
                                    membershipId &&
                                    membershipFile
                            ),
                        });
                    }
                    for (let i in filtered) {
                        const display = filtered[i];
                        await ctx.reply(
                            `last ${
                                byDay ? "day" : byWeek ? "week" : "month"
                            } up to ${display.to.toDateString()}`
                        );
                        for (let k in display.screenshots) {
                            const screenshot = display.screenshots[k];
                            await ctx.replyWithDocument(
                                screenshot.membershipFile,
                                {
                                    caption: `From user <a href="tg://user?id=${screenshot?.confirmedBy?.telegramId}">${screenshot?.confirmedBy?.name}</a>`,
                                    parse_mode: "HTML",
                                }
                            );
                        }
                        await ctx.reply(
                            `this ${
                                byDay ? "day" : byWeek ? "week" : "month"
                            } total = ${
                                display.screenshots.length
                            } forms\n------------------------------------------`
                        );
                    }
                } else if (
                    sessionData[ctx.chat.id]?.eventScreenshot.type == "money"
                ) {
                    let filtered = [];
                    const compareNumber = byDay ? 7 : byWeek ? 4 : 12;
                    let currentFil = new Date();
                    for (let index = 1; index <= compareNumber; index += 1) {
                        let now = new Date();
                        const ltDate = new Date(currentFil);
                        if (byDay) {
                            now.setDate(now.getDate() - index);
                        } else if (byWeek) {
                            now.setDate(now.getDate() - index * 7);
                        } else {
                            now.setMonth(now.getMonth() - index);
                        }
                        const gtDate = new Date(now);
                        currentFil = new Date(now);
                        filtered.push({
                            from: gtDate,
                            to: ltDate,
                            money: allConfirmed.filter(
                                ({
                                    createdTime,
                                    anyId,
                                    membershipId,
                                    monthlyId,
                                    fixedId,
                                }) =>
                                    createdTime < ltDate &&
                                    createdTime >= gtDate &&
                                    (anyId ||
                                        membershipId ||
                                        monthlyId ||
                                        fixedId)
                            ),
                        });
                    }
                    let outerTotal = 0;
                    for (let i in filtered) {
                        const display = filtered[i];
                        await ctx.reply(
                            `last ${
                                byDay ? "day" : byWeek ? "week" : "month"
                            } up to ${display.to.toDateString()}`
                        );
                        let innerTotal = 0;
                        for (let k in display.money) {
                            const money = display.money[k];
                            const type = money.any
                                ? "any"
                                : money.fixed
                                ? "fixed"
                                : money.membership
                                ? "membership"
                                : "monthly";
                            const amount =
                                type === "any"
                                    ? money.anyAmount
                                    : money[type].amount;
                            console.log(money[type]);
                            innerTotal += amount;
                            await ctx.reply(
                                `type: ${type}\namount:${amount}\nFrom user <a href="tg://user?id=${money?.confirmedBy?.telegramId}">${money?.confirmedBy?.name}</a>`,
                                { parse_mode: "HTML" }
                            );
                        }
                        await ctx.reply(
                            `this ${
                                byDay ? "day" : byWeek ? "week" : "month"
                            } total = ${innerTotal} Birr\n------------------------------------------`
                        );
                        outerTotal += innerTotal;
                    }
                    await ctx.reply(`total from all ${outerTotal} Birr`);
                } else {
                    let gtDate = new Date();
                    const ltDate = new Date();
                    if (byDay) {
                        gtDate.setDate(gtDate.getDate() - 7); //last 7 days
                    } else if (byWeek) {
                        gtDate.setMonth(gtDate.getMonth() - 1); //last 4 weeks(last month)
                    } else {
                        gtDate.setFullYear(gtDate.getFullYear() - 1); //last year(last 12 months)
                    }
                    const subscriptions = allConfirmed.filter(
                        ({ createdTime, membershipId, membershipFile }) =>
                            createdTime < ltDate &&
                            createdTime >= gtDate &&
                            membershipId &&
                            membershipFile
                    );
                    const money = allConfirmed.filter(
                        ({
                            createdTime,
                            anyId,
                            membershipId,
                            monthlyId,
                            fixedId,
                        }) =>
                            createdTime < ltDate &&
                            createdTime >= gtDate &&
                            (anyId || membershipId || monthlyId || fixedId)
                    );
                    const events = allConfirmed.filter(
                        ({ createdTime, eventId }) =>
                            createdTime < ltDate &&
                            createdTime >= gtDate &&
                            eventId
                    );
                    //all we need is the count for events and subscriptions, so lets calculate for money
                    let total = 0;
                    for (let i in money) {
                        const money1 = money[i];
                        const type = money1.any
                            ? "any"
                            : money1.fixed
                            ? "fixed"
                            : money1.membership
                            ? "membership"
                            : "monthly";
                        const amount =
                            type === "any"
                                ? money1.anyAmount
                                : money1[type].amount;
                        total += amount;
                    }
                    await ctx.reply(
                        `in the last ${
                            byDay ? "week" : byWeek ? "month" : "year"
                        } we got \n${total} birr, ${
                            events.length
                        } people attended events, ${
                            subscriptions.length
                        } people subscribed for a membership!`
                    );
                }
            } catch (e) {
                console.log(e);
                await ctx.reply("something went wrong!");
            }
        }
    );
};
