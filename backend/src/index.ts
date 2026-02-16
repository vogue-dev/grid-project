import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { initDb } from "./db.js";
import { attachRealtime } from "./realtime.js";
import { rowsRouter } from "./routes/rows.js";

const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/rows", rowsRouter);

const server = createServer(app);
const { setupPgListener } = attachRealtime(server);

const start = async () => {
  await initDb();
  await setupPgListener();

  const PORT = Number(process.env.PORT ?? 8080);
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`BFF listening on :${PORT}`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
