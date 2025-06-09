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

/**
 * Determines whether the data point at index `i` is a pivot high.
 *
 * A pivot high is defined as a point where the `high` value is higher than the `high` values
 * of the preceding `left` bars and not lower than the `high` values of the following `right` bars.
 *
 * Algorithm:
 * - Compares the `high` value at index `i` to the `high` values of the previous `left` bars.
 *   If any previous bar has a `high` greater than or equal to the pivot, returns `false`.
 * - Compares the `high` value at index `i` to the `high` values of the next `right` bars.
 *   If any next bar has a `high` strictly greater than the pivot, returns `false`.
 * - Returns `true` only if the pivot is strictly higher than all previous `left` bars
 *   and greater than or equal to all next `right` bars.
 *
 * @param data - Array of OHLCV data points.
 * @param i - Index of the data point to check.
 * @param left - Number of bars to the left to consider.
 * @param right - Number of bars to the right to consider.
 * @returns `true` if the data point at index `i` is a pivot high, otherwise `false`.
 */
function isPivotHigh(data: OHLCV[], i: number, left: number, right: number): boolean {
    // The pivot is the high price at index i
    const pivot = data[i].high;
    // Check left bars: all must have highs strictly less than the pivot
    for (let j = i - left; j < i; j++) {
        if (j < 0 || data[j].high >= pivot) return false;
    }
    // Check right bars: all must have highs less than or equal to the pivot (strictly less for at least one)
    for (let j = i + 1; j <= i + right; j++) {
        if (j >= data.length || data[j].high > pivot) return false;
    }
    // If all checks pass, index i is a pivot high
    return true;
}

/**
 * Determines whether the data point at index `i` is a pivot low.
 *
 * A pivot low is defined as a point where the `low` value is lower than the `low` values
 * of the preceding `left` bars and not higher than the `low` values of the following `right` bars.
 *
 * Algorithm:
 * - Compares the `low` value at index `i` to the `low` values of the previous `left` bars.
 *   If any previous bar has a `low` less than or equal to the pivot, returns `false`.
 * - Compares the `low` value at index `i` to the `low` values of the next `right` bars.
 *   If any next bar has a `low` strictly less than the pivot, returns `false`.
 * - Returns `true` only if the pivot is strictly lower than all previous `left` bars
 *   and less than or equal to all next `right` bars.
 *
 * @param data - Array of OHLCV data points.
 * @param i - Index of the data point to check.
 * @param left - Number of bars to the left to consider.
 * @param right - Number of bars to the right to consider.
 * @returns `true` if the data point at index `i` is a pivot low, otherwise `false`.
 */
function isPivotLow(data: OHLCV[], i: number, left: number, right: number): boolean {
    // The pivot is the low price at index i
    const pivot = data[i].low;
    // Check left bars: all must have lows strictly greater than the pivot
    for (let j = i - left; j < i; j++) {
        // If any previous bar is out of bounds or has a low <= pivot, not a pivot low
        if (j < 0 || data[j].low <= pivot) return false;
    }
    // Check right bars: all must have lows greater than or equal to the pivot (strictly greater for at least one)
    for (let j = i + 1; j <= i + right; j++) {
        // If any next bar is out of bounds or has a low < pivot, not a pivot low
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
