# MEAN Stack Quick Start

## Prerequisites
- Node.js (v18+ recommended)
- npm
- MongoDB (local or Atlas)
- Angular CLI (installed globally: `npm install -g @angular/cli`)

---

## Backend Setup (server/)
1. Move to backend folder:
   ```
   cd server
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables:
   - Edit `.env` as needed (default: `MONGO_URI`, `PORT`)
4. Start the backend server:
   ```
   npx tsx src/index.ts
   ```
   - App runs at `http://localhost:5000` (unless PORT is overridden).

---

## Frontend Setup (client/)
1. Move to frontend folder:
   ```
   cd client
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the Angular development server:
   ```
   ng serve
   ```
   - App runs at `http://localhost:4200`
   - Tailwind CSS is included in styles by default.

---

## Features
- Modular Express backend (MVC structure)
- MongoDB integration via Mongoose
- TypeScript for backend safety
- Angular 19+ frontend with Tailwind CSS, SSR (optional), and AI tooling

## Notes
- For advanced Angular features (SSR/SSG, AI tools), see docs in `/client/README.md` and `/client/.claude/CLAUDE.md`.
- Update API endpoints and environment settings as needed.

---

## Project Structure
```
/server   # Express/Mongoose backend
/client   # Angular frontend
```

---

## Quick Start Checklist
- [x] Backend: install, configure, run server
- [x] Frontend: install, configure, run Angular app
- [x] Full MEAN setup using modern tools