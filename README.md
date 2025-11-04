# Odyssey

Odyssey is a React + Vite app for planning trips, saving memories, and discovering smart suggestions near your points of interest. It features a starry background, itinerary builder with autosuggestions, and a memories section backed by AWS APIs and S3.

## Features

- Starry background with twinkling stars (disabled on Help; visible on Sign-in via lighter overlays)
- Sign-in/Sign-up with token storage in `sessionStorage`
- Store signed-in user email for API calls
- Trip planner with:
  - Smart auto-suggestions for places near the selected start location or stops
  - Ability to add suggestions directly to the itinerary
  - Save itinerary to backend (`/api/prod/trip/save`) and locally
- Memories:
  - Upload photos (kept in memory for current session to avoid `localStorage` quota)
  - Save memories to backend (`/api/prod/memory`) with tripId, email, images, notes
  - View memories list from backend (`/api/prod/getmemory?email=...`) with expandable details
  - Display images via signed S3 URLs with graceful fallbacks
- Vite dev proxy configured to avoid CORS for AWS endpoints

## Tech Stack

- React 18, Vite, Tailwind CSS
- React Router
- Motion for animations
- AWS API Gateway + Lambda (proxied via Vite)
- AWS S3 for images

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Install

```bash
cd frontend
npm install
```

### Run (Dev)

```bash
cd frontend
npm run dev
```

The Vite dev server starts at `http://localhost:5173`.

## Proxy (CORS)

Vite proxy is set in `frontend/vite.config.js` to route API calls and bypass CORS:

- `/api` → `https://721inkpci4.execute-api.us-east-2.amazonaws.com`
- `/places` → `https://places.geo.us-east-2.api.aws`
- `/serpapi` → `https://serpapi.com`

In the app, always call APIs with the proxied path, e.g. `/api/prod/memory`.

## Auth & Storage

- Sign-in stores:
  - `access_token` in `sessionStorage`
  - `user_email` in `sessionStorage`
- Use `sessionStorage.getItem("user_email")` for API calls instead of hardcoding
- Avoid saving base64 images to `localStorage` (quota issues). Photos are kept only in component state during a session.

## Key API Endpoints

- Save itinerary: `POST /api/prod/trip/save`
  - Body: `{ tripId, email, userId }`
- Save memory: `POST /api/prod/memory`
  - Body: `{ tripId, email, images: string[], additionalInfo }`
- Get memories: `GET /api/prod/getmemory?email=<email>`

## Notable UI/Behavior

- Stars background is rendered globally in `App.jsx`; lighter overlays on login keep stars visible
- Help page intentionally hides the star background
- Memories page uses a repeating `doodles.png` background
- Each polaroid has an X (remove) control; photos can be removed locally

## Troubleshooting

- CORS errors: ensure you use proxied paths (`/api/...`) while running via Vite dev server
- 500 errors from memory save: check backend logs; frontend saves a minimal local backup (metadata only)
- Images not showing: backend should return signed URLs; otherwise ensure bucket, region, and permissions are correct

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m "feat: your feature"`
4. Push to your fork: `git push -u fork feat/your-feature`
5. Open a Pull Request

## License

MIT