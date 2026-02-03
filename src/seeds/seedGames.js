// Seed script to populate the "games" collection using the existing Game model.
// Usage:
//   1) Place this file at: src/seeds/seedGames.js
//   2) Place rawgGames.seed.json at: src/seeds/rawgGames.seed.json
//   3) Run: node src/seeds/seedGames.js

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import Game from "../models/Game.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing in .env");

  await mongoose.connect(uri);
  console.log("Connected to Mongo");

  // Load games from seed files (rawgGames.seed.json and rawgGames2025.seed.json if present)
  const seedFiles = ["rawgGames.seed.json", "rawgGames2025.seed.json"];
  const allDocs = [];

  for (const fileName of seedFiles) {
    const filePath = path.join(__dirname, fileName);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const docs = JSON.parse(raw);
        allDocs.push(...docs);
        console.log(`Loaded ${docs.length} games from ${fileName}`);
      } catch (err) {
        console.error(`Error reading ${fileName}:`, err.message);
      }
    } else {
      console.log(`${fileName} not found, skipping...`);
    }
  }

  if (allDocs.length === 0) {
    console.error("No games to seed. Add rawgGames.seed.json or rawgGames2025.seed.json");
    await mongoose.disconnect();
    process.exit(1);
  }

  const docs = allDocs;
  console.log(`\nTotal games to process: ${docs.length}\n`);

  let inserted = 0,
    skipped = 0;
  for (const doc of docs) {
    // Create temp instance to generate slug in pre-validate
    const tmp = new Game(doc);
    await tmp.validate();
    const res = await Game.updateOne(
      { slug: tmp.slug },
      { $setOnInsert: tmp.toObject() },
      { upsert: true }
    );
    if (res.upsertedCount) inserted++;
    else skipped++;
  }

  console.log(`Done. Inserted: ${inserted}, Existing (skipped): ${skipped}`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
