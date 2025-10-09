import mongoose from "mongoose";
import Game from "../models/Game.js";

export async function getGames(req, res, next) {
  try {
    const { q } = req.query;
    const filter = q ? { title: { $regex: q, $options: "i" } } : {};
    const games = await Game.find(filter).sort({ createdAt: -1 });
    res.json(games);
  } catch (err) {
    next(err);
  }
}
