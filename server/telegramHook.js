const express = require('express');
const router = express.Router();

router.post('/hook', (req, res) => {
    res.sendStatus(200); // respond immediately

    // process async
    setImmediate(() => {
        const update = req.body;

        const chatId =
            update.message?.chat?.id ||
            update.edited_message?.chat?.id;

        if (chatId) {
            console.log("Chat ID:", chatId);
            // save to DB here
        }
    });
});

module.exports = router;