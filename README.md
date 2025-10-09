# Game Reviews API (Node + Express + MongoDB/Mongoose)

A minimal, production-ready(ish) REST API to power a game reviews website.

## Quickstart

```bash
# 1) Install deps
npm install

# 2) Copy env and set your MongoDB Atlas connection string
cp .env.example .env
# then edit .env and fill MONGODB_URI

# 3) Run dev server
npm run dev

# Health check
curl http://localhost:4000/health
```

## Endpoints

- `GET /health` – liveness
- `GET /api/games` – list games (optional `?q=search`)
- `GET /api/games/:idOrSlug` – single game by ObjectId or slug
- `POST /api/games` – create game
- `PATCH /api/games/:id` – update game by ObjectId
- `DELETE /api/games/:id` – delete game by ObjectId

## Example payload

```json
{
  "title": "Stardew Valley",
  "platforms": ["PC", "Switch"],
  "genres": ["Simulation", "RPG"],
  "rating": 9.4,
  "review": "Chill farming sim with heart.",
  "releaseDate": "2016-02-26",
  "coverImageUrl": "https://example.com/stardew.jpg"
}
```

## Notes

- Rate limit is set to 200 req / 15 min window by default (tweak in `src/app.js`).
- Slugs are auto-generated from `title` and kept unique.
