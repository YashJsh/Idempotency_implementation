import express from "express";
import client from "../db/db.js";

const router: express.Router = express.Router();

router.post("/payment", async (req, res) => {
    const { from_account_id, to_account_id, amount } = req.body;

    if (
        !Number.isInteger(from_account_id) ||
        !Number.isInteger(to_account_id) ||
        from_account_id === to_account_id ||
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        Math.round(amount * 100) !== amount * 100
    ) {
        return res.status(400).json({ error: "Invalid payment details" });
    }

    try {
        await client.query("BEGIN");

        const debit = await client.query(
            `
            UPDATE accounts SET amount = amount - $1 WHERE id = $2 AND amount >=$1 
            RETURNING id
            `,
            [amount, from_account_id]
        );

        if (debit.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Insufficient funds or invalid from_account_id" });
        };

        const credit = await client.query(
            `
            UPDATE accounts SET amount = amount + $1 WHERE id = $2
            RETURNING id
            `,
            [amount, to_account_id]
        );

        if (credit.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Receiver not found" });
        }

        const payment = await client.query("INSERT INTO payments (from_account_id, to_account_id, amount, status) VALUES ($1, $2, $3, $4) returning *", [req.body.from_account_id, req.body.to_account_id, req.body.amount, "succeeded"]);

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Payment successful",
            payment: payment.rows[0]
        });
    } catch (error) {
        try{
            await client.query("ROLLBACK");
        }
        catch (rollbackError) {
            console.error("Error rolling back transaction:", rollbackError);
        };

        return res.status(500).json({ error: "Payment failed", details: "Internal Server Error" });
    }
});


export default router;