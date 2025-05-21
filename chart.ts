import { Contract } from './contract';

const getReferenceDate = (): Date => new Date();

export interface ChartData {
  ticker: string;
  plotData: any[];
  layout: any;
}

export function generateChartData(
  ticker: string,
  contracts: Contract[],
  closingPrice: number,
  priceChangePct?: number // Add optional price change percentage
): ChartData {
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
      text: `${ticker} Options (${priceChangePct !== undefined ? (priceChangePct >= 0 ? '+' : '') + priceChangePct.toFixed(2) + '%' : ''})`,
      // Use HTML for colored percentage if supported
      ...(priceChangePct !== undefined && {
        text: `${ticker} Options (<span style="color:${pctColor}">${priceChangePct >= 0 ? '+' : ''}${priceChangePct.toFixed(2)}%</span>)`,
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
    showlegend: true,
    hovermode: 'closest'
  };

  return { ticker, plotData, layout };
}