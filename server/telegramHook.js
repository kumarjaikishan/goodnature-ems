const express = require('express');
const { sendTelegramMessageseperate } = require('./utils/telegram');
const router = express.Router();


router.post('/hook', (req, res) => {
    const update = req.body;

    res.sendStatus(200);

    setImmediate(async () => {
        try {
            const msg =
                update?.message ||
                update?.edited_message ||
                update?.callback_query?.message;

            const from =
                update?.message?.from ||
                update?.edited_message?.from ||
                update?.callback_query?.from;

            const chat = msg?.chat;
            const chatId = chat?.id;
            const text = msg?.text;

            if (!chatId) return;

            // =========================
            // 🔹 1. GROUP DETECTION
            // =========================
            if (chat?.type === "group" || chat?.type === "supergroup") {
                console.log("📢 Group Detected:");
                console.log("Group ID:", chatId);
                console.log("Group Name:", chat.title);

                // 👉 Save to DB (IMPORTANT)
                // await company.updateOne(
                //   { telegramToken: process.env.TELEGRAM_TOKEN },
                //   { "telegram.groupId": chatId }
                // );

                // ✅ Optional: confirm in group
                if (text === "/setgroup") {
                    await sendTelegramMessageseperate(
                        process.env.TELEGRAM_TOKEN,
                        chatId,
                        `✅ Group connected successfully!\n\nGroup ID: ${chatId}`
                    );
                }

                return; // ⛔ stop here for group
            }

            // =========================
            // 🔹 2. INDIVIDUAL USER
            // =========================
            if (text === "/userid") {
                const userData = {
                    chatId,
                    firstName: from?.first_name || null,
                    lastName: from?.last_name || null,
                    username: from?.username || null,
                    telegramId: from?.id
                };

                const message = `🆔 Your Telegram Details

👤 Name: ${userData.firstName || ""} ${userData.lastName || ""}
📛 Username: ${userData.username || "N/A"}
🆔 Telegram ID: ${userData.telegramId}
💬 Chat ID: ${userData.chatId}`;

                await sendTelegramMessageseperate(
                    process.env.TELEGRAM_TOKEN,
                    chatId,
                    message
                );
            }

        } catch (err) {
            console.error("Webhook processing error:", err);
        }
    });
});

// router.post('/hook', (req, res) => {
//     const update = req.body;

//     res.sendStatus(200);

//     setImmediate(async () => {
//         try {
//             const msg =
//                 update?.message ||
//                 update?.edited_message ||
//                 update?.callback_query?.message;

//             const from =
//                 update?.message?.from ||
//                 update?.edited_message?.from ||
//                 update?.callback_query?.from;

//             const chatId = msg?.chat?.id;
//             const text = msg?.text;

//             // 🔥 Trigger only for /userid
//             if (chatId && text === "/userid") {

//                 const userData = {
//                     chatId,
//                     firstName: from?.first_name || null,
//                     lastName: from?.last_name || null,
//                     username: from?.username || null,
//                     telegramId: from?.id
//                 };

//                 // console.log("Telegram User:", userData);

//                 const message = `🆔 Your Telegram Details

// 👤 Name: ${userData.firstName || ""} ${userData.lastName || ""}
// 📛 Username: ${userData.username || "N/A"}
// 🆔 Telegram ID: ${userData.telegramId}
// 💬 Chat ID: ${userData.chatId}`;

//                 // ✅ Use your prebuilt function
//                 await sendTelegramMessageseperate(
//                     process.env.TELEGRAM_TOKEN,
//                     chatId,
//                     message
//                 );
//             }

//         } catch (err) {
//             console.error("Webhook processing error:", err);
//         }
//     });
// });

// router.post('/hook', (req, res) => {
//     const update = req.body;

//     res.sendStatus(200);

//     setImmediate(() => {
//         try {
//             const msg =
//                 update?.message ||
//                 update?.edited_message ||
//                 update?.callback_query?.message;

//             const from =
//                 update?.message?.from ||
//                 update?.edited_message?.from ||
//                 update?.callback_query?.from;

//             const chatId = msg?.chat?.id;

//             if (chatId) {
//                 const userData = {
//                     chatId,
//                     firstName: from?.first_name || null,
//                     lastName: from?.last_name || null,
//                     username: from?.username || null,
//                     telegramId: from?.id
//                 };

//                 console.log("Telegram User:", userData);

//                 // 👉 Save in DB here
//             } else {
//                 console.log("No chatId found:", update);
//             }

//         } catch (err) {
//             console.error("Webhook processing error:", err);
//         }
//     });
// });


module.exports = router;