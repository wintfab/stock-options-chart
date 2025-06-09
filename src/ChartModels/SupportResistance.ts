// Copyright (c) 2025 fwinter. All rights reserved.

// Support and Resistance Level Calculation (based on LuxAlgo Pine Script)
// Returns arrays of resistance and support levels with their indices

export interface OHLCV {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface Level {
    index: number; // bar index (0 = oldest)
    price: number;
    type: 'resistance' | 'support';
}

export interface SupportResistanceResult {
    resistances: Level[];
    supports: Level[];
}

// Helper: find pivot high at index i
function isPivotHigh(data: OHLCV[], i: number, left: number, right: number): boolean {
    const pivot = data[i].high;
    for (let j = i - left; j < i; j++) {
        if (j < 0 || data[j].high >= pivot) return false;
    }
    for (let j = i + 1; j <= i + right; j++) {
        if (j >= data.length || data[j].high > pivot) return false;
    }
    return true;
}

// Helper: find pivot low at index i
function isPivotLow(data: OHLCV[], i: number, left: number, right: number): boolean {
    const pivot = data[i].low;
    for (let j = i - left; j < i; j++) {
        if (j < 0 || data[j].low <= pivot) return false;
    }
    for (let j = i + 1; j <= i + right; j++) {
        if (j >= data.length || data[j].low < pivot) return false;
    }
    return true;
}

export function computeSupportResistance(
    data: OHLCV[],
    leftBars = 15,
    rightBars = 15
): SupportResistanceResult {
    const resistances: Level[] = [];
    const supports: Level[] = [];
    for (let i = leftBars; i < data.length - rightBars; i++) {
        if (isPivotHigh(data, i, leftBars, rightBars)) {
            resistances.push({ index: i, price: data[i].high, type: 'resistance' });
        }
        if (isPivotLow(data, i, leftBars, rightBars)) {
            supports.push({ index: i, price: data[i].low, type: 'support' });
        }
    }
    return { resistances, supports };
}
