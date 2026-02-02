// Script to fetch games from RAWG.io API by release year (e.g. 2025)
// Usage: node src/seeds/fetchRawgRecentGames.js [page_number] [year]
// Example: node src/seeds/fetchRawgRecentGames.js 1       (fetches page 1 of 2025 games)
//          node src/seeds/fetchRawgRecentGames.js 2       (fetches page 2 of 2025 games)
//          node src/seeds/fetchRawgRecentGames.js 1 2024 (fetches page 1 of 2024 games)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = "5c3ad7524cd64caf880d20a8bfad6077";
const BASE_URL = "https://api.rawg.io/api/games";

// Configuration
const PAGE_SIZE = 50; // Number of games per page

// Get page number and year from command line (default: page 1, year 2025)
const pageNumber = parseInt(process.argv[2]) || 1;
const year = parseInt(process.argv[3]) || 2025;

// Build dates string for RAWG API: "YYYY-01-01,YYYY-12-31"
const datesParam = `${year}-01-01,${year}-12-31`;
const OUTPUT_FILE = path.join(__dirname, `rawgGames${year}.seed.json`);

// Fetch games from RAWG API for a specific page and year
async function fetchRecentGamesFromRawg(page, year) {
  try {
    const url = `${BASE_URL}?key=${API_KEY}&page=${page}&page_size=${PAGE_SIZE}&dates=${datesParam}`;
    console.log(
      `Fetching page ${page} (${PAGE_SIZE} games per page) - releases in ${year}...`
    );

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
        description: "",
        genres: game.genres ? game.genres.map((g) => g.name) : [],
        coverImageUrl: game.background_image || "",
        releaseDate: game.released || null,
      };

      if (processedGame.title && processedGame.slug) {
        processedGames.push(processedGame);
      }
    }

    console.log(
      `  ✓ Fetched ${processedGames.length} games from page ${page} (${year})`
    );
    return processedGames;
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    const newGames = await fetchRecentGamesFromRawg(pageNumber, year);

    if (newGames.length === 0) {
      console.log("\nNo games fetched. Exiting.");
      return;
    }

    // Load existing games from year-specific file if it exists
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

    // Remove duplicates based on slug
    const existingSlugs = new Set(existingGames.map((g) => g.slug));
    const uniqueNewGames = newGames.filter((g) => !existingSlugs.has(g.slug));

    if (uniqueNewGames.length < newGames.length) {
      console.log(
        `  ⚠ Skipped ${
          newGames.length - uniqueNewGames.length
        } duplicate game(s)`
      );
    }

    const allGames = [...existingGames, ...uniqueNewGames];

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allGames, null, 2), "utf-8");

    console.log(`\n✅ Successfully processed page ${pageNumber} (${year})!`);
    console.log(`   Added ${uniqueNewGames.length} new game(s)`);
    console.log(`   Total games in file: ${allGames.length}`);
    console.log(`📁 Saved to: ${OUTPUT_FILE}`);
    console.log(
      `\n💡 To fetch the next page, run: npm run fetch:rawg:recent ${pageNumber + 1} ${year}`
    );
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
