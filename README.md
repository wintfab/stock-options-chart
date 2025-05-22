# Stock Options Chart (Frontend)

This is a TypeScript frontend-only application for visualizing stock options charts.

## Features

- Upload a `contracts.txt` file (one contract per line)
- Parse contracts client-side
- Fetch stock data from Yahoo Finance (client-side)
- Render interactive Plotly charts for each ticker
- All logic is client-side using TypeScript and React

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Install dependencies

```sh
npm install
```

### Run the development server

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

- Click the upload button to select your `contracts.txt` file.
- The app will parse the contracts, fetch data, and display charts for each ticker.
- Get the financial modeling API key from https://site.financialmodelingprep.com/developer/docs/dashboard

## Project Structure

- `src/` - React components and logic
- `public/` - Static assets
- `vite.config.ts` - Vite configuration

## License

MIT
