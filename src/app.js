import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import Auth from "./routes/authRoutes.js";
import Game from "./routes/gameRoutes.js";
import Profile from "./routes/profileRoutes.js";
import Review from "./routes/reviewRoutes.js";
import Watchlist from "./routes/watchlistRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Core middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Basic rate limiting
app.set("trust proxy", 1);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Health
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api/auth", Auth);
app.use("/api/game", Game);
app.use("/api/profile", Profile);
app.use("/api/reviews", Review);
app.use("/api/watchlist", Watchlist);
// 404 + error handler
app.use(notFound);
app.use(errorHandler);

export default app;
