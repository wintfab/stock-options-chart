export interface Contract {
  ticker: string;
  expiration: Date;
  type: 'CALL' | 'PUT';
  strike: number;
}

export function parseContract(contract: string): Contract {
  // Example: TSLA250620P00280000
  const match = contract.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
  if (!match) {
    throw new Error(`Invalid contract format: ${contract}`);
  }

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