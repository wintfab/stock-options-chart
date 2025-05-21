import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Spinner, Button, Input } from '@fluentui/react-components';
import './App.css';

interface Contract {
  ticker: string;
  expiration: Date;
  type: 'CALL' | 'PUT';
  strike: number;
}

interface ChartData {
  ticker: string;
  plotData: any[];
  layout: any;
}

const API_KEY_CACHE_KEY = 'fmp_api_key_cache';

const getToday = (): string => {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

function parseContractLine(line: string): Contract | null {
  // Example: TSLA250523P00315000
  const regex = /^([A-Z]+)(\d{6})([CP])(\d{8})$/
  
  const match = line.match(regex);
  if (!match) return null;
  
  const [, ticker, dateStr, type, strikeStr] = match;
  
  // Parse date (YYMMDD -> YYYY-MM-DD)
  const year = `20${dateStr.slice(0, 2)}`;
  const month = dateStr.slice(2, 4);
  const day = dateStr.slice(4, 6);
  const expiration = new Date(`${year}-${month}-${day}`);

  // Parse strike price (e.g., 00280000 -> 280.00)
  const strike = parseInt(strikeStr) / 1000;

  return {
    ticker,
    expiration,
    type: type === 'C' ? 'CALL' : 'PUT',
    strike
  };
}

// Update fetchQuote to accept apiKey
async function fetchQuote(ticker: string, apiKey: string) {
  const key = apiKey || 'demo';
  const url = `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  const quote = data[0];
  return {
    price: quote?.price ?? 0,
    changePct: quote?.changesPercentage ?? 0,
  };
}

const getReferenceDate = (): Date => new Date();

function generateChartData(
  ticker: string,
  contracts: Contract[],
  closingPrice: number,
  priceChangePct?: number
): ChartData {
  // ...implement similar to your backend logic...
  // For brevity, this is a placeholder
  // Calculate days until expiration and filter for natural numbers
  const calculateDaysUntilExpiration = (expiration: Date): number => {
    const diffTime = expiration.getTime() - getReferenceDate().getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24)); // Convert ms to days and round
  };

  // Filter contracts to ensure days is a natural number (> 0)
  const validContracts = contracts.filter(c => {
    const days = calculateDaysUntilExpiration(c.expiration);
    return days > 0 && Number.isInteger(days);
  });

  const calls = validContracts.filter(c => c.type === 'CALL');
  const puts = validContracts.filter(c => c.type === 'PUT');

  // For calls: negative % if strike < closingPrice
  const callHover = calls.map(c => {
    const diff = ((c.strike - closingPrice) / closingPrice) * 100;
    // If call is below closing price, show negative value
    const pct = c.strike < closingPrice ? -Math.abs(diff) : diff;
    return `$${c.strike.toFixed(2)}, ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  });

  // For puts: negative % if strike > closingPrice
  const putHover = puts.map(p => {
    const diff = ((closingPrice - p.strike) / closingPrice) * 100;
    // If put is above closing price, show negative value
    const pct = p.strike > closingPrice ? -Math.abs(diff) : diff;
    return `$${p.strike.toFixed(2)}, ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  });

  // Add X symbol for calls below closing price, circle otherwise
  const callSymbols = calls.map(c => c.strike < closingPrice ? 'x' : 'circle');
  // Add X symbol for puts above closing price, circle otherwise
  const putSymbols = puts.map(p => p.strike > closingPrice ? 'x' : 'circle');

  const callTrace = {
    x: calls.map(c => calculateDaysUntilExpiration(c.expiration)),
    y: calls.map(c => c.strike),
    mode: 'markers',
    type: 'scatter',
    name: 'Call',
    marker: { color: 'blue', size: 10, symbol: callSymbols },
    text: callHover,
    hovertemplate: '%{text}<extra></extra>'
  };

  const putTrace = {
    x: puts.map(c => calculateDaysUntilExpiration(c.expiration)),
    y: puts.map(c => c.strike),
    mode: 'markers',
    type: 'scatter',
    name: 'Put',
    marker: { color: 'purple', size: 10, symbol: putSymbols },
    text: putHover,
    hovertemplate: '%{text}<extra></extra>'
  };

  // Closing price line spans slightly beyond min and max days to ensure visibility
  const days = validContracts.map(c => calculateDaysUntilExpiration(c.expiration));
  const maxDays = days.length > 0 ? Math.max(...days) : 1;

  // Determine if any call is below closing price or any put is above closing price
  const hasCallBelow = calls.some(c => c.strike < closingPrice);
  const hasPutAbove = puts.some(p => p.strike > closingPrice);
  const priceLineColor = (hasCallBelow || hasPutAbove) ? 'red' : 'green';

  // Expand the line by 1 day on each side
  const priceLine = {
    x: [0, maxDays + 1],
    y: [closingPrice, closingPrice],
    mode: 'lines',
    type: 'scatter',
    name: `Closing Price: $${closingPrice.toFixed(2)}`,
    line: { color: priceLineColor, dash: 'dash' }
  };

  const plotData = [callTrace, putTrace, priceLine].filter(trace => trace.x.length > 0);

  const uniqueDays = Array.from(new Set(days)).sort((a, b) => a - b);

  const pctColor = priceChangePct !== undefined
    ? (priceChangePct < 0 ? 'red' : 'green')
    : undefined;

  const layout = {
    title: {
      text: `${ticker} Options ($${closingPrice.toFixed(2)}, ${priceChangePct !== undefined ? (priceChangePct >= 0 ? '+' : '') + priceChangePct.toFixed(2) + '%' : ''})`,
      // Use HTML for colored percentage if supported
      ...(priceChangePct !== undefined && {
        text: `${ticker} Options ($${closingPrice.toFixed(2)}, <span style="color:${pctColor}">${priceChangePct >= 0 ? '+' : ''}${priceChangePct.toFixed(2)}%</span>)`,
      })
    },
    xaxis: {
      title: 'Days Until Expiration',
      type: 'linear',
      tickmode: 'array',
      tickvals: uniqueDays, // Only show unique days as ticks
      range: [0, Math.max(...uniqueDays, 1) + 1] // Always start at 0
    },
    yaxis: { title: 'Strike Price ($)' },
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    showlegend: true,
    hovermode: 'closest'
  };

  return { ticker, plotData, layout };
}

const App: React.FC = () => {
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // On mount, try to load API key from cache for today
  useEffect(() => {
    const cacheRaw = localStorage.getItem(API_KEY_CACHE_KEY);
    if (cacheRaw) {
      try {
        const cache = JSON.parse(cacheRaw);
        if (cache.date === getToday() && cache.key) {
          setApiKey(cache.key);
        }
      } catch {}
    }
  }, []);

  // Save API key to cache when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem(
        API_KEY_CACHE_KEY,
        JSON.stringify({ date: getToday(), key: apiKey })
      );
    }
  }, [apiKey]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const text = await file.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const contracts = lines.map(parseContractLine).filter(Boolean) as Contract[];
    const tickers = Array.from(new Set(contracts.map(c => c.ticker)));
    const tickerData: Record<string, { price: number; changePct: number }> = {};
    for (const ticker of tickers) {
      tickerData[ticker] = await fetchQuote(ticker, apiKey);
    }
    const contractsByTicker: Record<string, Contract[]> = {};
    for (const c of contracts) {
      if (!contractsByTicker[c.ticker]) contractsByTicker[c.ticker] = [];
      contractsByTicker[c.ticker].push(c);
    }
    // Sort tickers ascending
    const sortedTickers = tickers.slice().sort((a, b) => a.localeCompare(b));
    const chartData = sortedTickers.map(ticker =>
      generateChartData(
        ticker,
        contractsByTicker[ticker],
        tickerData[ticker].price,
        tickerData[ticker].changePct
      )
    );
    setCharts(chartData);
    setLoading(false);
  };

  return (
    <div className="App">
      <h1>Stock Options Scatter Charts</h1>
      {!charts.length && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="api-key-input">Financial Modeling Prep API Key: </label>
            <Input
              id="api-key-input"
              type="text"
              value={apiKey}
              onChange={(_, data) => setApiKey(data.value)}
              placeholder="Enter your FMP API key"
              style={{ width: 320 }}
            />
          </div>
          <input
            id="file-input"
            type="file"
            accept=".txt"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          <Button 
            appearance="primary" 
            onClick={() => document.getElementById('file-input')?.click()} 
            style={{ marginBottom: 16, display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
          >
            Upload Contracts
          </Button>
        </>
      )}
      {loading && <div style={{marginTop: 16}}><Spinner label="Loading chart data..." /></div>}
      <div className="charts-list">
        {charts.map(chart => (
          //<div key={chart.ticker} className="chart-container" style={{ width: '85vw', minWidth: 300, margin: '0 auto' }}>
          <div key={chart.ticker} className="chart-container" style={{ width: '100%', height: '400px', minWidth: 300, margin: '0 auto' }}>          
            <h2>{chart.ticker}</h2>
            <Plot 
              data={chart.plotData} 
              layout={chart.layout} 
              style={{ width: '100%', minHeight: 400 }} 
              useResizeHandler={true}
              className="responsive-plot"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
