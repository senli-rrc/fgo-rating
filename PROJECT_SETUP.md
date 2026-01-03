# FGO Rating App - Migration & Setup Guide

## 1. Project Goal
We are migrating an existing "No-Build" React application (currently using ES modules via CDN) to a production-ready **Vite + React + TypeScript** project. The goal is to set this up on localhost first.

## 2. Technical Stack
- **Build Tool:** Vite
- **Language:** TypeScript
- **Framework:** React
- **Styling:** Tailwind CSS
- **Database (Future Step):** Supabase (PostgreSQL) - *For now, we keep IndexedDB, but structure the project to allow swapping it later.*

## 3. Directory Structure Target
We need to move the flat file structure into a standard Vite layout:

```text
fgo-rating/
├── index.html          (Moved from root, script tags updated)
├── package.json        (New file)
├── tsconfig.json       (New file)
├── vite.config.ts      (New file)
├── postcss.config.js   (New file)
├── tailwind.config.js  (New file)
├── src/
│   ├── main.tsx        (Renamed from index.tsx)
│   ├── App.tsx
│   ├── index.css       (For Tailwind directives)
│   ├── types.ts
│   ├── vite-env.d.ts   (For Env variables)
│   ├── components/     (All component files)
│   ├── pages/          (All page files)
│   └── services/       (All service files)