import express from "express";
import client from "../db/db.js";

const router: express.Router = express.Router();

router.post("/payment", async (req, res) => {
    const { from_account_id, to_account_id, amount } = req.body;
    const idempotencyKey = req.header("Idempotency-Key");

    if (!idempotencyKey) {
        return res.status(400).json({ error: "Idempotency-Key header is required" });
    }

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
        await client.connect();
        await client.query("BEGIN");

        const claim = await client.query(
            `INSERT INTO payments
        (from_account_id, to_account_id, amount, status, idempotency_key)
     VALUES ($1, $2, $3, 'processing', $4)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING *`,
            [from_account_id, to_account_id, amount, idempotencyKey]
        );

        if (claim.rowCount === 0) {
            const existing = await client.query(
                `SELECT * FROM payments
                 WHERE idempotency_key = $1`,
                [idempotencyKey]
            );

            if (existing.rowCount === 0) {
                throw new Error("Existing idempotency record not found");
            }

            const previousPayment = existing.rows[0];

            if (
                previousPayment.from_account_id !== from_account_id ||
                previousPayment.to_account_id !== to_account_id ||
                Number(previousPayment.amount) !== amount
            ) {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    error: "Idempotency key reused with different payment details"
                });
            }
            await client.query("COMMIT");

            return res.status(200).json({
                message: "Payment already processed",
                payment: previousPayment
            });
        }

        const paymentId = claim.rows[0].id;

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



        const payment = await client.query(
            `UPDATE payments
             SET status = 'succeeded'
             WHERE id = $1
             RETURNING *`,
            [paymentId]
        );


        await client.query("COMMIT");

        return res.status(200).json({
            message: "Payment successful",
            payment: payment.rows[0]
        });
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        }
        catch (rollbackError) {
            console.error("Error rolling back transaction:", rollbackError);
        };

        return res.status(500).json({ error: "Payment failed", details: "Internal Server Error" });
    }
});


export default router;