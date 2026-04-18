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

            const chatId = msg?.chat?.id;
            const text = msg?.text;

            // 🔥 Trigger only for /userid
            if (chatId && text === "/userid") {

                const userData = {
                    chatId,
                    firstName: from?.first_name || null,
                    lastName: from?.last_name || null,
                    username: from?.username || null,
                    telegramId: from?.id
                };

                // console.log("Telegram User:", userData);

                const message = `🆔 Your Telegram Details

👤 Name: ${userData.firstName || ""} ${userData.lastName || ""}
📛 Username: ${userData.username || "N/A"}
🆔 Telegram ID: ${userData.telegramId}
💬 Chat ID: ${userData.chatId}`;

                // ✅ Use your prebuilt function
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