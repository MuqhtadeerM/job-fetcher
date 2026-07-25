import express from "express";
import logger from "./utils/logger.js";
import jobRoutes from './routes/jobRoutes.js'

// creating express app instance
const app = express();

// middleware
app.use(express.json());

// health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is Running" });
});

app.use(jobRoutes);

// if no route this is run
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// global error handler
app.use((err, req, res, next) => {
  // console.error(err.stack); we can use logger instead of this and here logger accepts the error object directly and it pull out errors automatically.
  logger.error(err);
  res.status(500).json({ error: "Internal error" });
});

export default app;
