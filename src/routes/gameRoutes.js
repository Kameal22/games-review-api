import { Router } from "express";
import { getGames } from "../controllers/gameController.js";

const router = Router();

router.get("/", getGames);

export default router;
