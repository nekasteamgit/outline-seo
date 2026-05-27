# Outline SEO

A free, lightweight heading structure analyzer for web pages.

## What it does

- Enter any public URL
- Get a full H1–H6 hierarchy tree
- See SEO metrics (heading count, depth, average length)
- Detect issues (missing H1, excessive depth, short headings)
- Export as Markdown

## Tech stack

- HTML/CSS/JS frontend (vanilla, no framework)
- Netlify Function (`netlify/functions/analyze.js`) for fetching and parsing
- Cheerio for HTML parsing

## Deploy

```bash
npm install
netlify deploy --prod
```

Or connect your GitHub repo to Netlify for auto-deploys.

## Why this exists

Built as a simple utility for content creators and SEOs who want to audit page structure quickly without signing up for a heavy tool.
