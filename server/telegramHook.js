const express = require('express');
const router = express.Router();


router.post('/hook', (req, res) => {
    const update = req.body;

    res.sendStatus(200);

    setImmediate(() => {
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

            if (chatId) {
                const userData = {
                    chatId,
                    firstName: from?.first_name || null,
                    lastName: from?.last_name || null,
                    username: from?.username || null,
                    telegramId: from?.id
                };

                console.log("Telegram User:", userData);

                // 👉 Save in DB here
            } else {
                console.log("No chatId found:", update);
            }

        } catch (err) {
            console.error("Webhook processing error:", err);
        }
    });
});


// router.post('/hook', (req, res) => {
//     const update = req.body; // ✅ capture first

//     res.sendStatus(200);

//     setImmediate(() => {
//         try {
//             const chatId =
//                 update?.message?.chat?.id ||
//                 update?.edited_message?.chat?.id ||
//                 update?.callback_query?.message?.chat?.id;

//             if (chatId) {
//                 console.log("Chat ID:", chatId);
//             } else {
//                 console.log("No chatId found:", update);
//             }
//         } catch (err) {
//             console.error("Webhook processing error:", err);
//         }
//     });
// });

module.exports = router;