// Seed script to populate the "games" collection using the existing Game model.
// Usage:
//   1) Place this file at: src/seeds/seedGames.js
//   2) Place games.seed.json at: src/seeds/games.seed.json
//   3) Run: node src/seeds/seedGames.js

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import Game from '../models/Game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing in .env');

  await mongoose.connect(uri);
  console.log('Connected to Mongo');

  const filePath = path.join(__dirname, 'games.seed.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const docs = JSON.parse(raw);

  let inserted = 0, skipped = 0;
  for (const doc of docs) {
    // Create temp instance to generate slug in pre-validate
    const tmp = new Game(doc);
    await tmp.validate();
    const res = await Game.updateOne(
      { slug: tmp.slug },
      { $setOnInsert: tmp.toObject() },
      { upsert: true }
    );
    if (res.upsertedCount) inserted++; else skipped++;
  }

  console.log(`Done. Inserted: ${inserted}, Existing (skipped): ${skipped}`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(()=>{});
  process.exit(1);
});