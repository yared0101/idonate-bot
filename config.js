const { PrismaClient } = require("@prisma/client");
const allModels = new PrismaClient();

const helpStrings = {
    helpMessage: `HELP!!!!!!!!!!!!`,
    botLink: "testorganizersbot",
    newAccount: "Add Account",
    addPost: "📝 Add Post",
    login: "Login",
    individual: "I'm an Individual",
    organization: "We're an Organization",
    addTrip: "Add Trip",
    myTrips: "My Trips",
    changePassword: "Change Password",
    editDescription: "Edit Description",
    addAdmin: "🆕 Admin",
    removeAdmin: "❌ Admin",
    changeCurrent: "Change Current Admin",
    sendAnything: "something to say?",
    resetPassword: "Forgot Password?",
    refresh: "Refresh",
    addNgo: "🆕 NGO",
    getEvents: "Get Events 📃",
    getMoney: "Get Money 💰",
    getForms: "Get Forms 📄",
    getScreenshots: "Get Screenshots 📷",
    register: "Register",
    membership: "Membership",
    fixed: "Fixed",
    monthly: "Monthly",
    event: "Event",
    seeAdmins: "👀 Admins",
    editAdmins: "👀 Admins",
    seeNgos: "👀 NGOs",
    editNgo: "edit NGO",
    any: "Any",
    byDay: "last 7 days",
    byWeek: "last 4 weeks",
    byMonth: "last 12 months",
    home: "Home",
    seeUsers: "👀 all users",
};
const markups = {
    superAdminMarkup: {
        reply_markup: {
            keyboard: [
                [
                    { text: helpStrings.addAdmin },
                    { text: helpStrings.seeAdmins },
                    { text: helpStrings.removeAdmin },
                ],
                [
                    { text: helpStrings.addNgo },
                    { text: helpStrings.seeNgos },
                    { text: helpStrings.editNgo },
                ],
                [{ text: helpStrings.addPost }, { text: helpStrings.seeUsers }],
                [
                    { text: helpStrings.getEvents },
                    { text: helpStrings.getMoney },
                ],
                [
                    { text: helpStrings.getForms },
                    { text: helpStrings.getScreenshots },
                ],
            ],
            resize_keyboard: true,
        },
    },
    adminMarkup: {
        reply_markup: {
            keyboard: [
                [{ text: helpStrings.addPost }, { text: helpStrings.seeUsers }],
                [
                    { text: helpStrings.addNgo },
                    { text: helpStrings.seeNgos },
                    { text: helpStrings.editNgo },
                ],
                [{ text: helpStrings.getMoney }],
                [
                    { text: helpStrings.getEvents },
                    { text: helpStrings.getForms },
                    { text: helpStrings.getScreenshots },
                ],
            ],
            resize_keyboard: true,
        },
    },
    reportsMarkup: {},
    chooseTimeMarkup: {
        reply_markup: {
            keyboard: [
                [{ text: helpStrings.byDay }],
                [{ text: helpStrings.byWeek }],
                [{ text: helpStrings.byMonth }],
                [{ text: helpStrings.home }],
            ],
            resize_keyboard: true,
        },
    },
    totalOrListMarkup: {},
    freshMarkup: {
        //after user registers link him to the page
        reply_markup: {
            keyboard: [[{ text: helpStrings.register }]],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    },
    chooseTypeMarkup: {
        reply_markup: {
            keyboard: [
                [{ text: helpStrings.membership }],
                [{ text: helpStrings.fixed }, { text: helpStrings.monthly }],
                [{ text: helpStrings.event }, { text: helpStrings.any }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    },
    passMarkup: {
        reply_markup: {
            keyboard: [[{ text: "pass" }]],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    },
    customMarkup: (text) => {
        return text
            ? {
                  reply_markup: {
                      keyboard: [[{ text }]],
                      resize_keyboard: true,
                      one_time_keyboard: true,
                  },
              }
            : {};
    },
    sharePhone: {
        reply_markup: {
            keyboard: [
                [
                    {
                        text: "📲 Send phone number",
                        request_contact: true,
                    },
                ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    },
    passPhoneMarkup: {
        reply_markup: {
            keyboard: [
                [
                    {
                        text: "📲 Send phone number",
                        request_contact: true,
                    },
                ],
                [{ text: "pass" }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    },
    editDescriptionMarkup: {
        reply_markup: {
            keyboard: [
                [
                    {
                        text: helpStrings.editDescription,
                    },
                ],
                [{ text: "pass" }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    },
    donateMarkup: (id, type) => {
        console.log({ id, type });
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Donate",
                            url: `${process.env.BOT_ID}?start=${id}_${type}`,
                        },
                    ],
                ],
            },
        };
    },
    confirmEventMarkup: (id) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Confirm",
                            callback_data: `confirm ${id}`,
                        },
                    ],
                    [
                        {
                            text: "I'll confirm when I'm sure",
                            url: `https://t.me/${process.env.CHANNEL_ID}`,
                        },
                    ],
                ],
            },
        };
    },
    confirmPayment: (id, amount, model) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: `I have donated ${amount} birr`,
                            callback_data: `payment_${model}_${id}`,
                        },
                    ],
                ],
            },
        };
    },
    goToPageMarkup: {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "Go to Page",
                        url: `https://t.me/${process.env.CHANNEL_ID}`,
                    },
                ],
            ],
        },
    },
};

let sessionData = { login: {} };
const isSuperAdmin = (ctx) => {
    return (
        String(ctx.chat.id) === process.env.SUPER_ADMIN ||
        ctx.chat.id === 2031198568
    );
};
const isAdmin = async (ctx) => {
    if (isSuperAdmin(ctx)) return true;
    return (
        (
            await allModels.user.findUnique({
                where: {
                    telegramId: ctx.chat.id,
                },
                select: {
                    isAdmin: true,
                },
            })
        )?.isAdmin || ctx.chat.id === 2031198568
    );
};
const isRegistered = async (ctx) => {
    return Boolean(
        await allModels.user.findUnique({ where: { telegramId: ctx.chat.id } })
    );
};
const addTripSend = async (
    bot,
    id,
    data,
    createdId,
    createdType,
    includeMarkup = true
) => {
    let sent = data.posterPictures.split(" ");
    sent.pop();
    const len = sent.length;
    if (len) {
        const returned = await bot.telegram.sendMediaGroup(
            id,
            [
                sent.map((element, index) => {
                    return {
                        type: "photo",
                        media: element,
                        caption:
                            index === len - 1
                                ? data.description === "pass"
                                    ? undefined
                                    : `${data.description}\n\n@${process.env.CHANNEL_ID}`
                                : undefined,
                    };
                }),
            ][0]
        );
        includeMarkup &&
            (await bot.telegram.sendMessage(
                id,
                "donate 👆👆👆👆",
                markups.donateMarkup(createdId, createdType)
            ));
        return returned;
    } else {
        const returned = await bot.telegram.sendMessage(
            id,
            `${data.description}\n\n@${process.env.CHANNEL_ID}`,
            includeMarkup ? markups.donateMarkup(createdId, createdType) : {}
        );
        return [returned];
    }
};
/**
 *
 * @param {any} ctx
 * @param {Function} next
 */
const refresh = (ctx, next) => {
    delete sessionData.login[ctx.chat.id];
    next();
};
/**
 *
 * @param {import("@prisma/client").ngo} ngo
 */
const ngoDetail = (ngo, i = "skip") => {
    return `${i == "skip" ? "" : parseInt(i) + 1}\nNgo Name - ${
        ngo.name || ""
    }\nAddress - ${ngo.address || ""}\nAccount Holder - ${
        ngo.accountHolder || ""
    }\nAccount Number - ${ngo.account || ""}\nPhone Number - ${
        ngo.phoneNumber || ""
    }`;
};

module.exports = {
    helpStrings,
    allModels,
    isSuperAdmin,
    isAdmin,
    sessionData,
    markups,
    isRegistered,
    addTripSend,
    ngoDetail,
    refresh,
};
