import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT ?? 3000);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
