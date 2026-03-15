# Frontend

This directory currently contains two frontend implementations:

- `index.html` + `app.js` + `style.css`: primary UI that is connected to the backend API
- `src/` (React + Vite): starter scaffold, not yet integrated with backend endpoints

## Run the Integrated UI (Recommended)

Start a static server from this folder:

```bash
python -m http.server 5500
```

Then open `http://127.0.0.1:5500`.

Ensure the FastAPI backend is running at `http://127.0.0.1:8000`.

## Run React Starter (Optional)

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

For complete project setup, API usage, and architecture, see the root `README.md`.
