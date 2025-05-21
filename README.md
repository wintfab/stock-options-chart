# Stock Options Chart

This project visualizes stock option contracts for multiple tickers using interactive Plotly scatter charts in a web interface.

## Features

- Reads option contracts from a `contracts.txt` file (one per line)
- Fetches real-time stock prices and daily percentage changes using Yahoo Finance
- Plots Calls and Puts with days to expiration vs. strike price
- Visual cues:
  - "X" marker for calls below the current price and puts above the current price
  - Closing price line (green if all contracts are "safe", red if any are "in danger")
  - Chart title includes today's price percentage change, colored green/red
- Responsive, resizable charts

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Install dependencies

```sh
npm install
```

### Build the project

```sh
npm run build
```

### Run the server

```sh
npm start
```

Or for development with auto-reload:

```sh
npm run dev
```

### View the charts

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- Edit `contracts.txt` in the project root to add/remove option contracts (one per line).
- To use a different contracts file, run:
  ```sh
  npm start -- path/to/your_contracts.txt
  ```

## Debugging

- VS Code launch configuration is provided in `.vscode/launch.json`.
- Set breakpoints in `.ts` files and use the "npm: start" debug configuration.

## Project Structure

- `index.ts` - Main server and data loader
- `chart.ts` - Chart data generation logic
- `template.ts` - HTML rendering for charts
- `contracts.txt` - List of option contracts to visualize

## License

MIT