const express = require('express');
const router = express.Router();

router.post('/hook', (req, res) => {
    const update = req.body; // ✅ capture first

    res.sendStatus(200);

    setImmediate(() => {
        try {
            const chatId =
                update?.message?.chat?.id ||
                update?.edited_message?.chat?.id ||
                update?.callback_query?.message?.chat?.id;

            if (chatId) {
                console.log("Chat ID:", chatId);
            } else {
                console.log("No chatId found:", update);
            }
        } catch (err) {
            console.error("Webhook processing error:", err);
        }
    });
});

module.exports = router;