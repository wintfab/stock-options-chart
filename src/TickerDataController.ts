// Copyright (c) 2025 fwinter. All rights reserved.

import { getToday } from "./utils";

export class TickerDataController {
    static async fetchQuote(ticker: string, apiKey: string) {
        try {
            const key = apiKey || "demo";
            const url = `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${key}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Network error");
            const data = await res.json();
            const quote = data[0];
            return {
                price: quote?.price ?? 0,
                changePct: quote?.changesPercentage ?? 0,
            };
        } catch (err) {
            console.error(`[TickerDataController.fetchQuote] Error fetching quote for ${ticker}:`, err);
            return { price: 0, changePct: 0 };
        }
    }

    // Helper to get today's price and changePct for a ticker, with localStorage caching
    static async getTickerInfo(ticker: string, apiKey: string): Promise<{ price: number; changePct: number }> {

        const today = getToday();
        const cacheKey = `fmp_quote_cache_${ticker}`;
        let cached = null;
        try {
            const raw = localStorage.getItem(cacheKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.date === today && typeof parsed.price === 'number' && typeof parsed.changePct === 'number') {
                    cached = parsed;
                }
            }
        } catch (err) {
            console.error(`[TickerDataController.getTickerInfo] Error reading cache for ${ticker}:`, err);
        }
        if (cached) {
            return { price: cached.price, changePct: cached.changePct };
        } else {
            try {
                const fetchedTicket = await TickerDataController.fetchQuote(ticker, apiKey);
                if (fetchedTicket.price !== 0 && fetchedTicket.changePct !== 0) {
                    localStorage.setItem(cacheKey, JSON.stringify({ date: today, price: fetchedTicket.price, changePct: fetchedTicket.changePct }));
                    // Update global cache update key with the most recent time
                    localStorage.setItem('fmp_quote_cache_last_update', new Date().toISOString());
                }
                return fetchedTicket;
            } catch (err) {
                console.error(`[TickerDataController.getTickerInfo] Error fetching ticker info for ${ticker}:`, err);
                return { price: 0, changePct: 0 };
            }
        }
    }

    static async fetchPriceHistory(
        ticker: string,
        apiKey: string,
        cache: Record<string, { history: any[]; ma52: { date: string; sma: number }[] }>
    ): Promise<{ history: any[]; ma52: { date: string; sma: number }[] }> {
        try {
            const today = getToday();
            const cacheKey = `fmp_history_cache_${ticker}_${today}`;
            if (cache[cacheKey]) return cache[cacheKey];

            const [historyResp, maResp] = await Promise.all([
                fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?timeseries=90&apikey=${apiKey}`),
                fetch(`https://financialmodelingprep.com/api/v3/technical_indicator/daily/${ticker}?period=52&type=sma&apikey=${apiKey}`)
            ]);
            const historyJson = await historyResp.json();
            const maJson = await maResp.json();

            const history = historyJson.historical || [];
            const ma52 = Array.isArray(maJson) ? maJson : [];

            return { history, ma52 };
        } catch (err) {
            console.error(`[TickerDataController.fetchPriceHistory] Error:`, err);
            return { history: [], ma52: [] };
        }
    }
}
