# Organogram

An open-source, browser-based org chart builder. Upload a CSV, get an interactive org chart. No account, no server, no dependencies beyond your browser.

**[Try it live →](https://organogram.pages.dev)** · [GitHub](https://github.com/bodhish/organogram)

![Organogram screenshot](docs/screenshot.png)

## Features

- **CSV-driven** — paste or upload a spreadsheet; the chart renders instantly
- **N× open positions** — write `3× Frontend Engineers` and get 3 individual open-position cards
- **Shareable links** — the entire dataset encodes into the URL; share with anyone
- **Local storage** — save multiple organograms and manage them from the home page
- **Edit in-browser** — spreadsheet-style panel to change names, titles, reporting lines, and open/filled status without touching a file
- **Department colours** — each department auto-gets a colour; a legend is shown on the chart
- **Pan & zoom** — drag to pan, scroll/pinch to zoom, ⊡ to fit everything on screen

## CSV format

```csv
id,name,title,department,manager_id,is_open
1,Alex Morgan,CEO,Leadership,,false
2,Sam Rivera,CTO,Engineering,1,false
3,Jordan Lee,Lead Designer,Design,1,false
4,Dana Park,Backend Engineer,Engineering,2,false
5,3× Frontend Engineers,Frontend Engineer,Engineering,2,true
```

| Column | Required | Description |
|---|---|---|
| `id` | ✓ | Unique identifier for each person/role |
| `name` | ✓ | Display name. Use `N× Role` to expand into N open-position cards |
| `title` | | Job title shown below the name |
| `department` | | Controls the card accent colour and legend |
| `manager_id` | | `id` of this person's manager. Blank = root node |
| `is_open` | | `true` marks the card as an unfilled open position |

### N× bulk open positions

```csv
19,3× Frontend Engineers,Frontend Engineer,Engineering,9,true
```

This single row expands into **three** individual "Open Position" cards, all reporting to id `9`. Use either `×` (multiplication sign) or `x` (letter).

## Getting started

```bash
git clone https://github.com/bodhish/organogram
cd organogram
npm install
npm run dev
```

Open [http://localhost:5175](http://localhost:5175).

### Build for production

```bash
npm run build
# output in dist/
```

The built output is a fully static site — drop `dist/` into any static host (Cloudflare Pages, Vercel, Netlify, GitHub Pages).

## Tech stack

- [React 19](https://react.dev) + [Vite 8](https://vite.dev)
- [d3-hierarchy](https://d3js.org/d3-hierarchy) for tree structure
- [PapaParse](https://www.papaparse.com) for CSV parsing
- Custom compact layout engine (no d3-layout — children wrap into at most 2 rows per parent)
- URL-safe base64 encoding for shareable links

## Contributing

Bug reports, feature ideas, and pull requests are welcome.

1. Fork the repo and create a branch
2. Make your changes with `npm run dev`
3. Run `npm run build` to confirm no build errors
4. Open a pull request

Please keep PRs focused — one feature or fix per PR.

## Deploying to Cloudflare Pages

```bash
npm install -g wrangler
wrangler login
npm run build
wrangler pages project create organogram --production-branch main
wrangler pages deploy dist --project-name organogram
```

For auto-deploys on every push, connect the GitHub repo in the [Cloudflare Pages dashboard](https://pages.cloudflare.com).

## License

MIT
