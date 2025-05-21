import express from 'express';
import yfinance from 'yahoo-finance2';
import { parseContract, Contract } from './contract';
import { generateChartData, ChartData } from './chart';
import { renderHTML } from './template';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3000;

// Determine contracts file: use parameter if provided and file exists, else fallback to contracts.txt
const paramFile = process.argv[2];
let contractsFile = path.join(__dirname, 'contracts.txt');
if (paramFile) {
  const paramPath = path.isAbsolute(paramFile) ? paramFile : path.join(__dirname, paramFile);
  if (fs.existsSync(paramPath)) {
    contractsFile = paramPath;
  } else {
    console.error(`Provided contracts file does not exist: ${paramPath}`);
    process.exit(1);
  }
}

// Read contracts from contractsFile (one per line)
const contracts: string[] = fs.readFileSync(contractsFile, 'utf-8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

async function main() {
  // Parse contracts
  const parsedContracts = contracts.map(parseContract);

  // Group by ticker
  const contractsByTicker = parsedContracts.reduce((acc, contract) => {
    if (!acc[contract.ticker]) {
      acc[contract.ticker] = [];
    }
    acc[contract.ticker].push(contract);
    return acc;
  }, {} as Record<string, Contract[]>);

  // Fetch closing prices and percentage changes
  const closingPrices: Record<string, number> = {};
  const priceChanges: Record<string, number> = {};
  for (const ticker of Object.keys(contractsByTicker)) {
    try {
      const quote = await yfinance.quote(ticker);
      closingPrices[ticker] = quote.regularMarketPrice ?? 0;
      priceChanges[ticker] = quote.regularMarketChangePercent ?? 0;
    } catch (error) {
      console.error(`Error fetching price for ${ticker}:`, error);
      closingPrices[ticker] = 0; // Fallback
      priceChanges[ticker] = 0;
    }
  }

  // Generate chart data
  const charts = Object.entries(contractsByTicker)
    .sort(([a], [b]) => a.localeCompare(b)) // Sort tickers ascending
    .map(([ticker, contracts]) => {
      return generateChartData(
        ticker,
        contracts,
        closingPrices[ticker] || 0,
        priceChanges[ticker]
      );
    });

  // Serve HTML
  app.get('/', (req, res) => {
    res.send(renderHTML(charts));
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

main().catch(console.error);