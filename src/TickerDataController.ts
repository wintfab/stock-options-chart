// Copyright (c) 2025 fwinter. All rights reserved.

import { getToday } from "./utils";

export class TickerDataController {
    static async fetchQuote(ticker: string, apiKey: string) {
        const key = apiKey || "demo";
        const url = `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${key}`;
        const res = await fetch(url);
        const data = await res.json();
        const quote = data[0];
        return {
            price: quote?.price ?? 0,
            changePct: quote?.changesPercentage ?? 0,
        };
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
        } catch {}
        if (cached) {
            return { price: cached.price, changePct: cached.changePct };
        } else {
            const fetchedTicket = await TickerDataController.fetchQuote(ticker, apiKey);
            if (fetchedTicket.price !== 0 && fetchedTicket.changePct !== 0) {
                localStorage.setItem(cacheKey, JSON.stringify({ date: today, price: fetchedTicket.price, changePct: fetchedTicket.changePct }));
            }
            return fetchedTicket;
        }
    }
}
