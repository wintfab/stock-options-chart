// Copyright (c) 2025 fwinter. All rights reserved.

export type DeviationMethod = "Standard" | "Laplace" | "Absolute";
export type MeanMethod = "Auto" | "Average" | "Median";

export interface ProbabilityConesInput {
  source: number[]; // price series, most recent last
  deviation: DeviationMethod;
  meanMethod: MeanMethod;
  lookback: number;
  forecastBars: number;
  drift: boolean;
  anchorIndex: number; // index in source to anchor cone
  anchorOpen: boolean;
  deviations: {
    firstUpper: number;
    firstLower: number;
    secondUpper: number;
    secondLower: number;
    thirdUpper: number;
    thirdLower: number;
  };
}

export interface ProbabilityConesOutput {
  mean: number[];
  firstUpper: number[];
  firstLower: number[];
  secondUpper: number[];
  secondLower: number[];
  thirdUpper: number[];
  thirdLower: number[];
}

function sma(arr: number[], period: number) {
  if (arr.length < period) return NaN;
  return arr.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function median(arr: number[]) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdev(arr: number[], period: number) {
  if (arr.length < period) return NaN;
  const mean = sma(arr, period);
  const sqDiffs = arr.slice(-period).map(v => (v - mean) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / period);
}

function absoluteDeviation(arr: number[], mean: number) {
  return arr.reduce((sum, v) => sum + Math.abs(v - mean), 0) / arr.length;
}

/**
 * Calculates probability cones for a price series using log returns.
 * The cones represent forecasted price ranges based on historical volatility and user-defined deviation multipliers.
 *
 * Algorithm steps:
 * 1. Calculate log returns from the price series.
 * 2. Use the anchorIndex to select the anchor point and the relevant lookback window for statistics.
 * 3. Compute mean and deviation of log returns using selected methods (average, median, standard deviation, Laplace, absolute deviation).
 * 4. For each forecast bar, calculate the mean and upper/lower cone bounds using the selected deviation multipliers and drift option.
 * 5. Return arrays for the mean and each cone bound.
 */
export function calculateProbabilityCones(input: ProbabilityConesInput): ProbabilityConesOutput {
    const {
        source,
        deviation,
        meanMethod,
        lookback,
        forecastBars,
        drift,
        anchorIndex,
        anchorOpen,
        deviations,
    } = input;

    // 1. Calculate log returns from the price series
    const logReturns: number[] = [];
    for (let i = 1; i < source.length; ++i) {
        logReturns.push(Math.log(source[i] / source[i - 1]));
    }

    // 2. Select anchor point and lookback window for statistics
    const anchor = source[anchorIndex];
    const logReturnsSlice = logReturns.slice(anchorIndex - lookback, anchorIndex);

    // 3. Compute mean and deviation of log returns
    const logReturnsMedian = median(logReturnsSlice);
    const logReturnsAverage = sma(logReturnsSlice, lookback);
    const logReturnsStdev = stdev(logReturnsSlice, lookback);

    // Deviation calculations
    const absDev = absoluteDeviation(logReturnsSlice, meanMethod === "Median" ? logReturnsMedian : logReturnsAverage);
    const laplaceDev = Math.sqrt(2 * absDev ** 2);

    // Select mean based on method
    let mean: number;
    switch (meanMethod) {
        case "Average":
            mean = logReturnsAverage;
            break;
        case "Median":
            mean = logReturnsMedian;
            break;
        default: // "Auto"
            mean = deviation === "Standard" ? logReturnsAverage : logReturnsMedian;
    }

    // Select deviation based on method
    let dev: number;
    switch (deviation) {
        case "Standard":
            dev = logReturnsStdev;
            break;
        case "Laplace":
            dev = laplaceDev;
            break;
        case "Absolute":
            dev = absDev;
            break;
    }

    // 4. Forecast arrays for each cone bound
    const meanArr: number[] = [];
    const firstUpper: number[] = [];
    const firstLower: number[] = [];
    const secondUpper: number[] = [];
    const secondLower: number[] = [];
    const thirdUpper: number[] = [];
    const thirdLower: number[] = [];

    const anchorOpenVal = anchorOpen ? 1 : 0;

    for (let i = 0; i <= forecastBars; ++i) {
        // The periodSqrt models the growth of variance over time (Brownian motion)
        const periodSqrt = Math.sqrt(i + anchorOpenVal);
        // If drift is enabled, mean is scaled by i (number of forecast bars)
        const coneMean = drift ? mean * i : mean;
        // Forecasted mean price
        const meanValue = anchor * Math.exp(coneMean);

        meanArr.push(meanValue);

        // 5. Calculate upper and lower bounds for each cone using deviation multipliers
        // First
        const firstUpperVal = anchor * Math.exp(coneMean + deviations.firstUpper * dev * periodSqrt);
        const firstLowerVal = anchor * Math.exp(coneMean - deviations.firstLower * dev * periodSqrt);
        firstUpper.push(firstUpperVal);
        firstLower.push(firstLowerVal);

        // Second
        const secondUpperVal = anchor * Math.exp(coneMean + deviations.secondUpper * dev * periodSqrt);
        const secondLowerVal = anchor * Math.exp(coneMean - deviations.secondLower * dev * periodSqrt);
        secondUpper.push(secondUpperVal);
        secondLower.push(secondLowerVal);

        // Third
        const thirdUpperVal = anchor * Math.exp(coneMean + deviations.thirdUpper * dev * periodSqrt);
        const thirdLowerVal = anchor * Math.exp(coneMean - deviations.thirdLower * dev * periodSqrt);
        thirdUpper.push(thirdUpperVal);
        thirdLower.push(thirdLowerVal);
    }

    // 6. Return arrays for mean and each cone bound
    return {
        mean: meanArr,
        firstUpper,
        firstLower,
        secondUpper,
        secondLower,
        thirdUpper,
        thirdLower,
    };
}
