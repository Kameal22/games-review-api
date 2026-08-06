import { Router } from "express";
import { getGames } from "../controllers/gameController.js";

const router = Router();

router.get("/", getGames); // GET /api/game?q=&page=&limit=

export default router;
