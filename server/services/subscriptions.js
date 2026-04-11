const Subscription = require("../models/subscription");
const Payment = require("../models/payment_schema");
const User = require("../models/user");

const getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.userid;

        // 🔹 Get latest subscription
        const subscription = await Subscription
            .findOne({ userId })
            .sort({ createdAt: -1 });

        if (!subscription) {
            return res.json({
                status: "NOT_FOUND",
                message: "No subscription found"
            });
        }

        // 🔹 Optional: get payment details
        const payment = await Payment.findOne({
            subscriptionId: subscription._id
        });

        res.json({
            plan: subscription.plan,
            status: subscription.status,
            conf_type: subscription.conf_type,
            amount: subscription.amount,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            paymentId: subscription.paymentId,
            paymentStatus: payment?.status || "UNKNOWN"
        });

    } catch (error) {
        console.error("❌ GET SUBSCRIPTION ERROR:", error);
        res.status(500).json({ error: "Failed to fetch subscription" });
    }
};

const getAllTransactions = async (req, res) => {
    try {
        const data = await Payment.find()
            .populate({
                path: "subscriptionId",
                select: "plan status startDate endDate conf_type"
            })
            .populate({
                path: "userId",
                select: "name email profileImage"
            })
            .sort({ createdAt: -1 });

        res.json({ transactions: data });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
};

module.exports = { getSubscriptionStatus ,getAllTransactions};