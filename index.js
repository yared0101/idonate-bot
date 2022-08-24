require("dotenv").config();
const { Telegraf } = require("telegraf");
// const { Composer } = require("micro-bot");
const bot = new Telegraf(process.env.BOT_TOKEN);
// const bot = new Composer();
// bot.init = async (mBot) => {
//     bot.telegram = mBot.telegram;
// };
const {
    allModels,
    sessionData,
    markups,
    isAdmin,
    addTripSend,
    isSuperAdmin,
    isRegistered,
    ngoDetail,
} = require("./config");
const { user, ngo, fixed, membership, any, monthly, event, confirmed } =
    allModels;

//commands
const startCommand = require("./src/commands/start");
startCommand(bot);
const helpCommand = require("./src/commands/help");
helpCommand(bot);

//hears
const requests = require("./src/hears/requests");
requests(bot);

//actions
const decide = require("./src/actions/decide");
decide(bot);

bot.use((ctx, next) => {
    if (ctx.chat.type === "private") {
        next();
    } else {
    }
});
//here we handle data inputs out of context
bot.use(async (ctx) => {
    if (ctx.message && ctx.message.text) {
        try {
            if (
                sessionData[ctx.chat.id]?.addTrip &&
                !sessionData[ctx.chat.id]?.addTrip?.type
            ) {
                await ctx.reply(
                    "please use one of the provided buttons",
                    markups.chooseTypeMarkup
                );
            } else if (
                sessionData[ctx.chat.id]?.addTrip &&
                sessionData[ctx.chat.id]?.addTrip?.withUrl &&
                !sessionData[ctx.chat.id]?.addTrip?.url
            ) {
                await selectUrlCalled(ctx);
            } else if (
                sessionData[ctx.chat.id]?.addTrip &&
                !sessionData[ctx.chat.id]?.addTrip?.ngo &&
                !sessionData[ctx.chat.id]?.addTrip?.withUrl
            ) {
                await selectNgoCalled(ctx);
            } else if (
                sessionData[ctx.chat.id]?.addTrip &&
                sessionData[ctx.chat.id]?.addTrip?.ngo &&
                !sessionData[ctx.chat.id]?.addTrip?.amount &&
                !sessionData[ctx.chat.id]?.addTrip?.address &&
                ["membership", "monthly", "fixed", "event"].indexOf(
                    sessionData[ctx.chat.id]?.addTrip?.type
                ) != -1 &&
                !sessionData[ctx.chat.id]?.addTrip?.withUrl
            ) {
                await addAmountCalled(ctx);
            } else if (
                sessionData[ctx.chat.id]?.addTrip?.ngo ||
                sessionData[ctx.chat.id]?.addTrip?.url
            ) {
                await addTripCalled(ctx);
            } else if (sessionData[ctx.chat.id]?.eventScreenshot) {
                if (sessionData[ctx.chat.id]?.eventScreenshot.ngo) {
                    await ctx.reply("please use one of the buttons");
                } else {
                    await selectNgoForReport(ctx, "eventScreenshot");
                }
            } else if (sessionData[ctx.chat.id]?.editNgo) {
                await editNgoCalled(ctx);
            } else if (sessionData[ctx.chat.id]?.addNgo) {
                await addNgoCalled(ctx);
            } else if (sessionData[ctx.chat.id]?.addTrip?.posterPictures) {
                await callerBasedOnType(ctx);
            } else if (sessionData[ctx.chat.id]?.removeAdmin) {
                await removeAdminCalled(ctx);
            } else if (sessionData[ctx.chat.id]?.addAdmin) {
                if (
                    ctx.message?.entities &&
                    ctx.message.entities[0]?.type === "mention"
                ) {
                    await addAdminCalled(ctx);
                } else {
                    console.log(ctx.message);
                    await ctx.reply("please use this format @*******");
                }
            } else if (sessionData[ctx.chat.id]?.removeAdmin) {
                await removeAdminCalled(ctx);
            } else if (sessionData[ctx.chat.id]?.membership) {
                await clientMembershipCalled(ctx);
            } else if (sessionData[ctx.chat.id]?.any) {
                await clientAnyCalled(ctx);
            } else if (sessionData[ctx.chat.id]?.fixedOrMonthly) {
                await clientFixedOrMonthlyCalled(ctx);
                return;
            } else {
                await ctx.reply(
                    "please use one of the buttons",
                    isSuperAdmin(ctx)
                        ? markups.superAdminMarkup
                        : (await isAdmin(ctx))
                        ? markups.adminMarkup
                        : (await isRegistered(ctx))
                        ? markups.goToPageMarkup
                        : markups.freshMarkup
                );
            }
        } catch (e) {
            console.log(e);
            await ctx.reply("something went wrong");
        }
    } else {
        if (ctx?.update?.message?.contact) {
            if (sessionData[ctx.chat.id]?.register) {
                await registerCalled(ctx);
                return;
            }
        } else if (ctx?.message?.photo) {
            if (sessionData[ctx.chat.id]?.addTrip) {
                await addTripCalled(ctx);
                return;
            } else if (sessionData[ctx.chat.id]?.any) {
                await clientAnyCalled(ctx);
                return;
            } else if (sessionData[ctx.chat.id]?.fixedOrMonthly) {
                await clientFixedOrMonthlyCalled(ctx);
                return;
            } else if (sessionData[ctx.chat.id]?.membership) {
                await clientMembershipCalled(ctx);
                return;
            }
        } else if (ctx?.message?.document?.file_id) {
            if (sessionData[ctx.chat.id]?.addTrip?.type === "membership") {
                await callerBasedOnType(ctx);
                return;
            } else if (sessionData[ctx.chat.id]?.membership) {
                await clientMembershipCalled(ctx);
                return;
            }
        }
        console.log(ctx, ctx.message);

        await ctx.reply(
            "please use one of the buttons",
            isSuperAdmin(ctx)
                ? markups.superAdminMarkup
                : (await isAdmin(ctx))
                ? markups.adminMarkup
                : (await isRegistered(ctx))
                ? markups.goToPageMarkup
                : markups.freshMarkup
        );
    }
});
const registerCalled = async (ctx) => {
    const phoneNumber = ctx?.update?.message?.contact?.phone_number;
    const created = await user.upsert({
        where: {
            telegramId: ctx.chat.id,
        },
        update: {
            phoneNumber,
        },
        create: {
            ...sessionData[ctx.chat.id].register,
            phoneNumber,
        },
    });
    delete sessionData[ctx.chat.id];
    await ctx.reply(
        `Welcome ${created.name}, thank you for registering your phone`
    );
};
const callerBasedOnType = async (ctx) => {
    try {
        if (sessionData[ctx.chat.id].addTrip.type === "membership") {
            await membershipCalled(ctx, sessionData[ctx.chat.id].addTrip.url);
        } else if (sessionData[ctx.chat.id].addTrip.type === "fixed") {
            await fixedCalled(ctx, sessionData[ctx.chat.id].addTrip.url);
        } else if (sessionData[ctx.chat.id].addTrip.type === "monthly") {
            await monthlyCalled(ctx, sessionData[ctx.chat.id].addTrip.url);
        } else if (sessionData[ctx.chat.id].addTrip.type === "event") {
            await eventCalled(ctx, sessionData[ctx.chat.id].addTrip.url);
        } else if (sessionData[ctx.chat.id].addTrip.type === "any") {
            await anyCalled(ctx, sessionData[ctx.chat.id].addTrip.url);
        }
        delete sessionData[ctx.chat.id];
    } catch (e) {
        console.log(e);
        await ctx.reply("something went wrong");
    }
};
const membershipCalled = async (ctx, url) => {
    if (url) {
        await addTripSend(
            bot,
            `@${process.env.CHANNEL_ID}`,
            sessionData[ctx.chat.id].addTrip,
            "stuff",
            "membership",
            true,
            url
        );
        return await ctx.reply(
            "successfully sent to page",
            isSuperAdmin(ctx)
                ? markups.superAdminMarkup
                : (await isAdmin(ctx))
                ? markups.adminMarkup
                : (await isRegistered(ctx))
                ? markups.goToPageMarkup
                : markups.freshMarkup
        );
    }
    const fileId = ctx?.message?.document?.file_id;
    const created = await membership.create({
        data: {
            ngoName: sessionData[ctx.chat.id].addTrip.ngo,
            amount: sessionData[ctx.chat.id].addTrip.amount,
            toBeSentFile: fileId,
        },
    });
    const postData = await addTripSend(
        bot,
        `@${process.env.CHANNEL_ID}`,
        sessionData[ctx.chat.id].addTrip,
        created.id,
        "membership",
        true
    );
    await ctx.reply(
        "successfully sent to page",
        isSuperAdmin(ctx)
            ? markups.superAdminMarkup
            : (await isAdmin(ctx))
            ? markups.adminMarkup
            : (await isRegistered(ctx))
            ? markups.goToPageMarkup
            : markups.freshMarkup
    );
    await membership.update({
        where: { id: created.id },
        data: { pageId: String(postData[0].message_id) },
    });
};
const addNgoCalled = async (ctx) => {
    const NGO = sessionData[ctx.chat.id].addNgo.edit;
    if (!sessionData[ctx.chat.id].addNgo.name) {
        sessionData[ctx.chat.id].addNgo.name = ctx.message.text;
        await ctx.reply(
            "please send Address",
            markups.customMarkup(NGO?.address)
        );
    } else if (!sessionData[ctx.chat.id].addNgo.address) {
        sessionData[ctx.chat.id].addNgo.address = ctx.message.text;
        await ctx.reply(
            "please send Account Number",
            markups.customMarkup(NGO?.account)
        );
    } else if (!sessionData[ctx.chat.id].addNgo.account) {
        sessionData[ctx.chat.id].addNgo.account = ctx.message.text;
        await ctx.reply(
            "please send Account Holder Name",
            markups.customMarkup(NGO?.accountHolder)
        );
    } else if (!sessionData[ctx.chat.id].addNgo.accountHolder) {
        sessionData[ctx.chat.id].addNgo.accountHolder = ctx.message.text;
        await ctx.reply(
            "please send Phone Number",
            markups.customMarkup(NGO?.phoneNumber)
        );
    } else if (!sessionData[ctx.chat.id].addNgo.phoneNumber) {
        sessionData[ctx.chat.id].addNgo.phoneNumber = ctx.message.text;
        if (sessionData[ctx.chat.id].addNgo.edit) {
            const { name } = sessionData[ctx.chat.id].addNgo.edit;
            delete sessionData[ctx.chat.id].addNgo.edit;
            await ngo.update({
                where: { name },
                data: { ...sessionData[ctx.chat.id].addNgo },
            });
            await ctx.reply(
                "Ngo successfully updated",
                isSuperAdmin(ctx)
                    ? markups.superAdminMarkup
                    : markups.adminMarkup
            );
        } else {
            await ngo.create({
                data: {
                    ...sessionData[ctx.chat.id].addNgo,
                },
            });
            delete sessionData[ctx.chat.id].addNgo;
            await ctx.reply(
                "Ngo successfully created",
                isSuperAdmin(ctx)
                    ? markups.superAdminMarkup
                    : markups.adminMarkup
            );
        }
    }
};
const fixedCalled = async (ctx, url) => {
    if (url) {
        await addTripSend(
            bot,
            `@${process.env.CHANNEL_ID}`,
            sessionData[ctx.chat.id].addTrip,
            "stuff",
            "fixed",
            true,
            url
        );
        return await ctx.reply(
            "successfully sent to page",
            isSuperAdmin(ctx)
                ? markups.superAdminMarkup
                : (await isAdmin(ctx))
                ? markups.adminMarkup
                : (await isRegistered(ctx))
                ? markups.goToPageMarkup
                : markups.freshMarkup
        );
        s;
    }
    const created = await fixed.create({
        data: {
            ngoName: sessionData[ctx.chat.id].addTrip.ngo,
            amount: sessionData[ctx.chat.id].addTrip.amount,
        },
    });
    const postData = await addTripSend(
        bot,
        `@${process.env.CHANNEL_ID}`,
        sessionData[ctx.chat.id].addTrip,
        created.id,
        "fixed",
        true
    );
    await ctx.reply(
        "successfully sent to page",
        isSuperAdmin(ctx)
            ? markups.superAdminMarkup
            : (await isAdmin(ctx))
            ? markups.adminMarkup
            : (await isRegistered(ctx))
            ? markups.goToPageMarkup
            : markups.freshMarkup
    );
    await fixed.update({
        where: { id: created.id },
        data: { pageId: String(postData[0].message_id) },
    });
};
const monthlyCalled = async (ctx, url) => {
    if (url) {
        await addTripSend(
            bot,
            `@${process.env.CHANNEL_ID}`,
            sessionData[ctx.chat.id].addTrip,
            "stuff",
            "monthly",
            true,
            url
        );
        return await ctx.reply(
            "successfully sent to page",
            isSuperAdmin(ctx)
                ? markups.superAdminMarkup
                : (await isAdmin(ctx))
                ? markups.adminMarkup
                : (await isRegistered(ctx))
                ? markups.goToPageMarkup
                : markups.freshMarkup
        );
    }
    const created = await monthly.create({
        data: {
            ngoName: sessionData[ctx.chat.id].addTrip.ngo,
            amount: sessionData[ctx.chat.id].addTrip.amount,
        },
    });
    const postData = await addTripSend(
        bot,
        `@${process.env.CHANNEL_ID}`,
        sessionData[ctx.chat.id].addTrip,
        created.id,
        "monthly",
        true
    );
    await ctx.reply(
        "successfully sent to page",
        isSuperAdmin(ctx)
            ? markups.superAdminMarkup
            : (await isAdmin(ctx))
            ? markups.adminMarkup
            : (await isRegistered(ctx))
            ? markups.goToPageMarkup
            : markups.freshMarkup
    );
    await monthly.update({
        where: { id: created.id },
        data: { pageId: String(postData[0].message_id) },
    });
};
const eventCalled = async (ctx, url) => {
    if (url) {
        await addTripSend(
            bot,
            `@${process.env.CHANNEL_ID}`,
            sessionData[ctx.chat.id].addTrip,
            "stuff",
            "event",
            true,
            url
        );
        return await ctx.reply(
            "successfully sent to page",
            isSuperAdmin(ctx)
                ? markups.superAdminMarkup
                : (await isAdmin(ctx))
                ? markups.adminMarkup
                : (await isRegistered(ctx))
                ? markups.goToPageMarkup
                : markups.freshMarkup
        );
        s;
    }
    const created = await event.create({
        data: {
            ngoName: sessionData[ctx.chat.id].addTrip.ngo,
            address: sessionData[ctx.chat.id].addTrip.address,
        },
    });
    const postData = await addTripSend(
        bot,
        `@${process.env.CHANNEL_ID}`,
        sessionData[ctx.chat.id].addTrip,
        created.id,
        "event",
        true
    );
    await ctx.reply(
        "successfully sent to page",
        isSuperAdmin(ctx)
            ? markups.superAdminMarkup
            : (await isAdmin(ctx))
            ? markups.adminMarkup
            : (await isRegistered(ctx))
            ? markups.goToPageMarkup
            : markups.freshMarkup
    );
    await event.update({
        where: { id: created.id },
        data: { pageId: String(postData[0].message_id) },
    });
};
const anyCalled = async (ctx, url) => {
    if (url) {
        await addTripSend(
            bot,
            `@${process.env.CHANNEL_ID}`,
            sessionData[ctx.chat.id].addTrip,
            "stuff",
            "any",
            true,
            url
        );
        return await ctx.reply(
            "successfully sent to page",
            isSuperAdmin(ctx)
                ? markups.superAdminMarkup
                : (await isAdmin(ctx))
                ? markups.adminMarkup
                : (await isRegistered(ctx))
                ? markups.goToPageMarkup
                : markups.freshMarkup
        );
        s;
    }
    const created = await any.create({
        data: {
            ngoName: sessionData[ctx.chat.id].addTrip.ngo,
        },
    });
    const postData = await addTripSend(
        bot,
        `@${process.env.CHANNEL_ID}`,
        sessionData[ctx.chat.id].addTrip,
        created.id,
        "any",
        true
    );
    await ctx.reply(
        "successfully sent to page",
        isSuperAdmin(ctx)
            ? markups.superAdminMarkup
            : (await isAdmin(ctx))
            ? markups.adminMarkup
            : (await isRegistered(ctx))
            ? markups.goToPageMarkup
            : markups.freshMarkup
    );
    await any.update({
        where: { id: created.id },
        data: { pageId: String(postData[0].message_id) },
    });
};
const addTripCalled = async (ctx) => {
    try {
        let photo = ctx?.message?.photo?.pop()?.file_id;
        if (
            sessionData[ctx.chat.id].addTrip.posterPictures.split(" ").pop() !=
            "pass"
        ) {
            if (photo || ctx.message.text == "pass") {
                if (photo) {
                    sessionData[ctx.chat.id].addTrip.posterPictures +=
                        photo + " ";
                    await ctx.reply(
                        `${
                            sessionData[
                                ctx.chat.id
                            ].addTrip.posterPictures.split(" ").length - 1
                        } images so far...`
                    );
                } else {
                    if (!sessionData[ctx.chat.id].addTrip.posterPictures) {
                        sessionData[ctx.chat.id].addTrip.posterPictures +=
                            ctx.message.text;
                        await ctx.reply("Send description (required)");
                        return;
                    }
                    sessionData[ctx.chat.id].addTrip.posterPictures +=
                        ctx.message.text;
                    await ctx.reply("Send description", markups.passMarkup);
                }
            } else {
                await ctx.reply(
                    "please send pictures, pass when u finish",
                    markups.passMarkup
                );
                return;
            }
        } else {
            sessionData[ctx.chat.id].addTrip.description = ctx.message.text;
            if (sessionData[ctx.chat.id].addTrip.type === "membership") {
                if (sessionData[ctx.chat.id].addTrip.url) {
                    await callerBasedOnType(ctx);
                } else {
                    await ctx.reply("please send membership pdf file");
                }
            } else if (sessionData[ctx.chat.id].addTrip.type === "fixed") {
                await callerBasedOnType(ctx);
            } else if (sessionData[ctx.chat.id].addTrip.type === "monthly") {
                await callerBasedOnType(ctx);
            } else if (sessionData[ctx.chat.id].addTrip.type === "event") {
                await callerBasedOnType(ctx);
            } else if (sessionData[ctx.chat.id].addTrip.type === "any") {
                await callerBasedOnType(ctx);
            }
        }
    } catch (e) {}
};
const selectNgoCalled = async (ctx) => {
    const ngoName = parseInt(ctx.message.text);
    if (isNaN(ngoName)) {
        await ctx.reply(
            `please send number between 1 & ${
                sessionData[ctx.chat.id].addTrip.ngolist.length
            }`
        );
        return;
    }
    if (
        ngoName < 1 ||
        ngoName > sessionData[ctx.chat.id].addTrip.ngolist.length
    ) {
        await ctx.reply(
            `please send number between 1 & ${
                sessionData[ctx.chat.id].addTrip.ngolist.length
            }`
        );
        return;
    }
    const NGO = { ...sessionData[ctx.chat.id].addTrip.ngolist[ngoName - 1] };
    delete sessionData[ctx.chat.id].addTrip.ngolist;
    sessionData[ctx.chat.id].addTrip.ngo = NGO.name;
    if (
        ["membership", "monthly", "fixed", "event"].indexOf(
            sessionData[ctx.chat.id].addTrip.type
        ) != -1
    ) {
        let defaultAddress = {};
        const chosenNgo =
            sessionData[ctx.chat.id].addTrip.type == "event" &&
            (await ngo.findUnique({
                where: { name: sessionData[ctx.chat.id].addTrip.ngo },
            }));
        if (chosenNgo?.address) {
            defaultAddress = chosenNgo.address;
        }
        await ctx.reply(
            sessionData[ctx.chat.id].addTrip.type == "event"
                ? "send address of event"
                : "ok send amount now",
            defaultAddress
        );
    } else {
        await ctx.reply("ok send photos now", markups.passMarkup);
    }
};
const addAmountCalled = async (ctx) => {
    if (sessionData[ctx.chat.id].addTrip.type !== "event") {
        const amount = parseInt(ctx.message.text);
        if (isNaN(amount) || amount < 1) {
            await ctx.reply("please send number above 1 birr");
            return;
        }
        sessionData[ctx.chat.id].addTrip.amount = amount;
    } else {
        sessionData[ctx.chat.id].addTrip.address = ctx.message.text;
    }
    await ctx.reply("ok send photos now", markups.passMarkup);
};
const addAdminCalled = async (ctx) => {
    try {
        let username = ctx.message.text.split("");
        username.shift();
        username = username.join("");
        console.log(username);
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
                `${newAdmin.name}(@${username}) is now an admin`,
                markups.superAdminMarkup
            );
            await bot.telegram.sendMessage(
                newAdmin.telegramId,
                "You are now an admin"
            );
        } else {
            console.log(username);
            await ctx.reply(
                "sorry user isn't registered, please tell the user to register to the bot"
            );
        }
        delete sessionData[ctx.chat.id].addAdmin;
    } catch (e) {
        console.log(e);
        await ctx.reply("something went wrong");
    }
};
const removeAdminCalled = async (ctx) => {
    try {
        const admins = sessionData[ctx.chat.id].removeAdmin;

        const text = Math.floor(Number(ctx.message.text));
        if (isNaN(text)) {
            await ctx.reply("please send a number");
            return;
        }
        if (text < 1 || text > admins.length) {
            await ctx.reply(
                `please send a number between 1 and ${admins.length}`
            );
            return;
        }

        const removedAdmin = admins[text - 1];
        await user.update({
            where: { telegramId: removedAdmin.telegramId },
            data: { isAdmin: false },
        });
        try {
            await bot.telegram.sendMessage(
                removedAdmin.telegramId,
                "you aren't an admin anymore"
            );
        } catch {}
        delete sessionData[ctx.chat.id].removeAdmin;
        await ctx.reply("The user is now  regular!", markups.superAdminMarkup);
    } catch (e) {}
};
const selectUrlCalled = async (ctx) => {
    const urlEntity = ctx?.message?.entities?.find(
        (elem) => elem.type === "url"
    );
    if (urlEntity) {
        sessionData[ctx.chat.id].addTrip.url = ctx.message.text.slice(
            urlEntity.offset,
            urlEntity.length
        );
        await ctx.reply("ok send photos now", markups.passMarkup);
    } else {
        await ctx.reply("please send a normal link", markups.passMarkup);
    }
};
const editNgoCalled = async (ctx) => {
    const editedNgo = parseInt(ctx.message.text);
    if (isNaN(editedNgo)) {
        await ctx.reply(
            `please send number between 1 & ${
                sessionData[ctx.chat.id].editNgo.length
            }`
        );
        return;
    }
    if (editedNgo < 1 || editedNgo > sessionData[ctx.chat.id].editNgo.length) {
        await ctx.reply(
            `please send number between 1 & ${
                sessionData[ctx.chat.id].editNgo.length
            }`
        );
        return;
    }
    const NGO = { ...sessionData[ctx.chat.id].editNgo[editedNgo - 1] };
    delete sessionData[ctx.chat.id].editNgo;
    try {
        sessionData[ctx.chat.id] = {
            addNgo: { edit: NGO },
        };
        await ctx.reply("please send NGO name", markups.customMarkup(NGO.name));
    } catch {
        await ctx.reply("something went wrong");
    }
};
const clientAnyCalled = async (ctx) => {
    if (!sessionData[ctx.chat.id].any.amount) {
        const amount = parseInt(ctx.message.text);
        if (isNaN(amount) || amount < 1) {
            await ctx.reply("please send number above 1 birr");
            return;
        }
        sessionData[ctx.chat.id].any.amount = amount;
        await ctx.reply(
            "Thank You! for your kindness.\nUse the Address Below to Donate."
        );
        const data = await any.findUnique({
            where: { id: sessionData[ctx.chat.id].any.id },
            include: { ngo: true },
        });
        await ctx.reply(ngoDetail(data.ngo));
    } else if (!sessionData[ctx.chat.id].any.photo) {
        sessionData[ctx.chat.id].any.photo =
            ctx?.message?.photo?.pop()?.file_id;
        if (!sessionData[ctx.chat.id].any.photo) {
            ctx.reply("please send an image");
            return;
        }
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
        await any.update({
            where: {
                id: sessionData[ctx.chat.id].any.id,
            },
            data: {
                confirmed: {
                    create: {
                        confirmedById: confirmer?.id,
                        anyAmount: sessionData[ctx.chat.id].any.amount,
                        screenshot: sessionData[ctx.chat.id].any.photo,
                    },
                },
            },
        });
        delete sessionData[ctx.chat.id];
        await ctx.reply("Success, thank you for your donation.");
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
    }
};
const clientMembershipCalled = async (ctx) => {
    if (!sessionData[ctx.chat.id].membership.file) {
        const file = ctx?.message?.document?.file_id;
        if (!file) {
            await ctx.reply("Please send filled in in form");
            return;
        }
        sessionData[ctx.chat.id].membership.file = file;
        const data = await membership.findUnique({
            where: { id: sessionData[ctx.chat.id].membership.id },
            include: { ngo: true },
        });
        await ctx.reply(
            `thanks, please send screenshot of your transaction. send ${data.amount} birr to...`
        );
        await ctx.reply(ngoDetail(data.ngo));
    } else if (!sessionData[ctx.chat.id].membership.photo) {
        sessionData[ctx.chat.id].membership.photo =
            ctx?.message?.photo?.pop()?.file_id;
        if (!sessionData[ctx.chat.id].membership.photo) {
            ctx.reply("please send an image");
            return;
        }
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
        await membership.update({
            where: {
                id: sessionData[ctx.chat.id].membership.id,
            },
            data: {
                confirmed: {
                    create: {
                        confirmedById: confirmer?.id,
                        membershipFile:
                            sessionData[ctx.chat.id].membership.file,
                        screenshot: sessionData[ctx.chat.id].membership.photo,
                    },
                },
            },
        });
        delete sessionData[ctx.chat.id];
        await ctx.reply("Success, thank you for your donation.");
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
    }
};
const clientFixedOrMonthlyCalled = async (ctx) => {
    sessionData[ctx.chat.id].fixedOrMonthly.photo =
        ctx?.message?.photo?.pop()?.file_id;
    if (!sessionData[ctx.chat.id].fixedOrMonthly.photo) {
        ctx.reply("please send an image");
        return;
    }
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
    console.log(
        sessionData[ctx.chat.id].fixedOrMonthly.model,
        sessionData[ctx.chat.id].fixedOrMonthly,
        sessionData[ctx.chat.id]
    );
    await allModels[sessionData[ctx.chat.id].fixedOrMonthly.model].update({
        where: {
            id: sessionData[ctx.chat.id].fixedOrMonthly.id,
        },
        data: {
            confirmed: {
                create: {
                    confirmedById: confirmer?.id,
                    screenshot: sessionData[ctx.chat.id].fixedOrMonthly.photo,
                },
            },
        },
    });
    delete sessionData[ctx.chat.id];
    await ctx.reply("Success, thank you for your donation.");
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
};
const selectNgoForReport = async (ctx, sessionName) => {
    const ngoName = parseInt(ctx.message.text);
    if (isNaN(ngoName)) {
        await ctx.reply(`please send number from above list`);
        return;
    }
    if (
        ngoName < 1 ||
        ngoName > sessionData[ctx.chat.id][sessionName].ngolist.length + 1
    ) {
        if (
            !(
                ngoName ===
                    sessionData[ctx.chat.id][sessionName].ngolist.length + 1 &&
                sessionData[ctx.chat.id]?.eventScreenshot.type === "money"
            )
        ) {
            await ctx.reply(
                `please send number between 1 & ${
                    sessionData[ctx.chat.id][sessionName].ngolist.length
                }`
            );
            return;
        }
    }
    if (ngoName === sessionData[ctx.chat.id][sessionName].ngolist.length + 1) {
        sessionData[ctx.chat.id][sessionName].allConfirmed =
            await confirmed.findMany({
                include: {
                    event: true,
                    any: true,
                    membership: true,
                    fixed: true,
                    monthly: true,
                    confirmedBy: true,
                },
            });
    }
    const NGO = {
        ...sessionData[ctx.chat.id][sessionName].ngolist[ngoName - 1],
    };
    delete sessionData[ctx.chat.id][sessionName].ngolist;
    sessionData[ctx.chat.id][sessionName].ngo = NGO.name || "all";
    await ctx.reply("please select range of report", markups.chooseTimeMarkup);
};
// module.exports = bot;
bot.launch();
console.log("started");
