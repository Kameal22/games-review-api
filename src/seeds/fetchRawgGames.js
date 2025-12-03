// Script to fetch games from RAWG.io API and create a seed file
// Usage: node src/seeds/fetchRawgGames.js [page_number]
// Example: node src/seeds/fetchRawgGames.js 1  (fetches page 1)
//          node src/seeds/fetchRawgGames.js 2  (fetches page 2)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = "5c3ad7524cd64caf880d20a8bfad6077";
const BASE_URL = "https://api.rawg.io/api/games";
const OUTPUT_FILE = path.join(__dirname, "rawgGames.seed.json");

// Configuration
const PAGE_SIZE = 50; // Number of games per page

// Get page number from command line argument (default to 1)
const pageNumber = parseInt(process.argv[2]) || 1;

// Fetch games from RAWG API for a specific page
async function fetchGamesFromRawg(page) {
  try {
    const url = `${BASE_URL}?key=${API_KEY}&page=${page}&page_size=${PAGE_SIZE}`;
    console.log(`Fetching page ${page} (${PAGE_SIZE} games per page)...`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log("No games available on this page.");
      return [];
    }

    const processedGames = [];

    // Process each game
    for (const game of data.results) {
      const processedGame = {
        title: game.name || "",
        slug: game.slug || "",
        // description is not provided by RAWG API, so we'll leave it empty
        description: "",
        genres: game.genres ? game.genres.map((g) => g.name) : [],
        coverImageUrl: game.background_image || "",
        releaseDate: game.released || null,
      };

      // Only add games with required fields
      if (processedGame.title && processedGame.slug) {
        processedGames.push(processedGame);
      }
    }

    console.log(`  ✓ Fetched ${processedGames.length} games from page ${page}`);
    return processedGames;
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Fetch games for the specified page
    const newGames = await fetchGamesFromRawg(pageNumber);

    if (newGames.length === 0) {
      console.log("\nNo games fetched. Exiting.");
      return;
    }

    // Load existing games if file exists
    let existingGames = [];
    if (fs.existsSync(OUTPUT_FILE)) {
      try {
        const existingData = fs.readFileSync(OUTPUT_FILE, "utf-8");
        existingGames = JSON.parse(existingData);
        console.log(`  ℹ Found ${existingGames.length} existing games in file`);
      } catch (err) {
        console.log(`  ⚠ Could not read existing file, starting fresh`);
      }
    }

    // Remove duplicates based on slug (in case page is fetched twice)
    const existingSlugs = new Set(existingGames.map((g) => g.slug));
    const uniqueNewGames = newGames.filter((g) => !existingSlugs.has(g.slug));

    if (uniqueNewGames.length < newGames.length) {
      console.log(
        `  ⚠ Skipped ${
          newGames.length - uniqueNewGames.length
        } duplicate game(s)`
      );
    }

    // Combine existing and new games
    const allGames = [...existingGames, ...uniqueNewGames];

    // Write to JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allGames, null, 2), "utf-8");

    console.log(`\n✅ Successfully processed page ${pageNumber}!`);
    console.log(`   Added ${uniqueNewGames.length} new game(s)`);
    console.log(`   Total games in file: ${allGames.length}`);
    console.log(`📁 Saved to: ${OUTPUT_FILE}`);
    console.log(
      `\n💡 To fetch the next page, run: npm run fetch:rawg ${pageNumber + 1}`
    );
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
