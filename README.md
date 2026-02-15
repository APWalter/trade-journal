# Shikuf

A personal trade journal for tracking, analyzing, and improving your trading performance. Forked from [Deltalytix](https://github.com/hugodemenez/deltalytix).

## Overview

Shikuf is a single-user trading analytics app built with Next.js, React, and Prisma. It connects to your broker, imports your trades, and gives you dashboards, charts, and AI-powered insights to help you become a better trader.

## Key Features

- **Trade Import** -- CSV upload, AI-powered field mapping, and broker sync
- **Interactive Dashboard** -- Customizable widgets, calendar view, and performance charts
- **AI Insights** -- Pattern recognition, trade journaling assistance, and coaching
- **Journal** -- Rich text editor with images, tags, and daily mindset tracking

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**, TypeScript 5
- **Prisma 7** with PostgreSQL (Supabase)
- **Supabase Auth** (email/password)
- **Deployed on Vercel**

## Getting Started

```bash
git clone https://github.com/APWalter/trade-journal.git
cd trade-journal
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Create a `.env.local` with your Supabase and OpenAI credentials. See the original Deltalytix README for full environment variable reference.

## License

This project is licensed under the [CC BY-NC 4.0](LICENSE) license. See the LICENSE file for details.
