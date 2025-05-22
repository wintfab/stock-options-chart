// Copyright (c) 2025 fwinter. All rights reserved.

import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import {
    Button,
    Input,
    Label,
    Link,
    Menu,
    MenuTrigger,
    MenuPopover,
    MenuList,
    MenuItem,
} from "@fluentui/react-components";
import {
    MoreHorizontal24Regular,
    FullScreenMaximize24Regular,
} from "@fluentui/react-icons";
import type { BrandVariants } from "@fluentui/react-components";
import {
    createLightTheme,
    FluentProvider,
} from "@fluentui/react-components";
import "./App.css";
import OfficeHeader from "./OfficeHeader";
import FullscreenChartModal from "./FullscreenChartModal";
import DragAndDropOverlay from "./DragAndDropOverlay";
import Loading from "./Loading";

interface Contract {
    ticker: string;
    expiration: Date;
    type: "CALL" | "PUT";
    strike: number;
}

interface ChartData {
    ticker: string;
    plotData: any[];
    layout: any;
}

const API_KEY_CACHE_KEY = "fmp_api_key_cache";

const getToday = (): string => {
    const d = new Date();
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

function parseContractLine(line: string): Contract | null {
    // Example: TSLA250523P00315000
    const regex = /^([A-Z]+)(\d{6})([CP])(\d{8})$/;

    const match = line.match(regex);
    if (!match) return null;

    const [, ticker, dateStr, type, strikeStr] = match;

    // Parse date (YYMMDD -> YYYY-MM-DD) in local time zone
    const year = 2000 + parseInt(dateStr.slice(0, 2), 10);
    const month = parseInt(dateStr.slice(2, 4), 10) - 1; // JS months are 0-based
    const day = parseInt(dateStr.slice(4, 6), 10);
    const expiration = new Date(year, month, day); // Local time zone

    // Parse strike price (e.g., 00280000 -> 280.00)
    const strike = parseInt(strikeStr) / 1000;

    return {
        ticker,
        expiration,
        type: type === "C" ? "CALL" : "PUT",
        strike,
    };
}

// Update fetchQuote to accept apiKey
async function fetchQuote(ticker: string, apiKey: string) {
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
async function getTickerInfo(ticker: string, apiKey: string): Promise<{ price: number; changePct: number }> {
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
        const fetchedTicket = await fetchQuote(ticker, apiKey);
        if (fetchedTicket.price !== 0 && fetchedTicket.changePct !== 0) {
            localStorage.setItem(cacheKey, JSON.stringify({ date: today, price: fetchedTicket.price, changePct: fetchedTicket.changePct }));
        }
        return fetchedTicket;
    }
}

const getReferenceDate = (): Date => new Date();

function generateChartData(
    ticker: string,
    contracts: Contract[],
    closingPrice: number,
    priceChangePct?: number,
): ChartData {
    // ...implement similar to your backend logic...
    // For brevity, this is a placeholder
    // Calculate days until expiration and filter for natural numbers
    const calculateDaysUntilExpiration = (expiration: Date): number => {
        const diffTime = expiration.getTime() - getReferenceDate().getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24)); // Convert ms to days and round
    };

    // Filter contracts to ensure days is a natural number (>= 0)
    const validContracts = contracts.filter((c) => {
        const days = calculateDaysUntilExpiration(c.expiration);
        return days >= 0 && Number.isInteger(days);
    });

    const calls = validContracts.filter((c) => c.type === "CALL");
    const puts = validContracts.filter((c) => c.type === "PUT");

    // For calls: negative % if strike < closingPrice
    const callHover = calls.map((c) => {
        const diff = ((c.strike - closingPrice) / closingPrice) * 100;
        // If call is below closing price, show negative value
        const pct = c.strike < closingPrice ? -Math.abs(diff) : diff;
        return `$${c.strike.toFixed(2)}, ${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
    });

    // For puts: negative % if strike > closingPrice
    const putHover = puts.map((p) => {
        const diff = ((closingPrice - p.strike) / closingPrice) * 100;
        // If put is above closing price, show negative value
        const pct = p.strike > closingPrice ? -Math.abs(diff) : diff;
        return `$${p.strike.toFixed(2)}, ${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
    });

    // Add X symbol for calls below closing price, circle otherwise
    const callSymbols = calls.map((c) =>
        c.strike < closingPrice ? "x" : "circle",
    );
    // Add X symbol for puts above closing price, circle otherwise
    const putSymbols = puts.map((p) =>
        p.strike > closingPrice ? "x" : "circle",
    );

    const callTrace = {
        x: calls.map((c) => calculateDaysUntilExpiration(c.expiration)),
        y: calls.map((c) => c.strike),
        mode: "markers",
        type: "scatter",
        name: "Call",
        marker: { color: "blue", size: 10, symbol: callSymbols },
        text: callHover,
        hovertemplate: "%{text}<extra></extra>",
    };

    const putTrace = {
        x: puts.map((c) => calculateDaysUntilExpiration(c.expiration)),
        y: puts.map((c) => c.strike),
        mode: "markers",
        type: "scatter",
        name: "Put",
        marker: { color: "purple", size: 10, symbol: putSymbols },
        text: putHover,
        hovertemplate: "%{text}<extra></extra>",
    };

    // Closing price line spans slightly beyond min and max days to ensure visibility
    const days = validContracts.map((c) =>
        calculateDaysUntilExpiration(c.expiration),
    );
    const maxDays = days.length > 0 ? Math.max(...days) : 1;

    // Determine if any call is below closing price or any put is above closing price
    const hasCallBelow = calls.some((c) => c.strike < closingPrice);
    const hasPutAbove = puts.some((p) => p.strike > closingPrice);
    const priceLineColor = hasCallBelow || hasPutAbove ? "red" : "green";

    // Expand the line by 1 day on each side
    const priceLine = {
        x: [0, maxDays],
        y: [closingPrice, closingPrice],
        mode: "lines",
        type: "scatter",
        name: `Closing Price: $${closingPrice.toFixed(2)}`,
        line: { color: priceLineColor, dash: "dash" },
    };

    const plotData = [callTrace, putTrace, priceLine].filter(
        (trace) => trace.x.length > 0,
    );

    const uniqueDays = Array.from(new Set(days)).sort((a, b) => a - b);

    const pctColor =
        priceChangePct !== undefined
            ? priceChangePct < 0
                ? "red"
                : "green"
            : undefined;

    const layout = {
        title: {
            text: `<span style="font-size: 18px; font-weight: bold;">${ticker}</span> ($${closingPrice.toFixed(2)}, ${priceChangePct !== undefined ? (priceChangePct >= 0 ? "+" : "") + priceChangePct.toFixed(2) + "%" : ""})`,
            // Use HTML for colored percentage and H2-styled ticker if supported
            ...(priceChangePct !== undefined && {
                text: `<span style="font-size: 18px; font-weight: bold;">${ticker}</span> ($${closingPrice.toFixed(2)}, <span style="color:${pctColor}">${priceChangePct >= 0 ? "+" : ""}${priceChangePct.toFixed(2)}%</span>)`,
            }),
        },
        xaxis: {
            title: { text: "Days Until Expiration" },
            autorange: true,
            type: "linear",
            tickmode: "array",
            tickvals: uniqueDays, // Only show unique days as ticks
            range: [0, Math.max(...uniqueDays, 1) + 1], // Always start at 0
        },
        yaxis: {
            title: { text: "Strike Price ($)" },
            autorange: true,
        },
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        showlegend: true,
        hovermode: "closest",
    };

    return { ticker, plotData, layout };
}

const officeBrand: BrandVariants = {
    10: "#061724",
    20: "#082338",
    30: "#0A2E4A",
    40: "#0C3B5E",
    50: "#0E4775",
    60: "#0F548C",
    70: "#115EA3",
    80: "#0F6CBD",
    90: "#2886DE",
    100: "#479EF5",
    110: "#62ABF5",
    120: "#77B7F7",
    130: "#96C6FA",
    140: "#B4D6FA",
    150: "#CFE4FA",
    160: "#EBF3FC",
};
const officeTheme = createLightTheme(officeBrand);

const App: React.FC = () => {
    const [charts, setCharts] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [dragEnabled, setDragEnabled] = useState(false);
    const [fullscreenChart, setFullscreenChart] = useState<ChartData | null>(null);
    const [filter, setFilter] = useState<string>("none");
    const [lastContractsText, setLastContractsText] = useState<string | null>(null);

    // On mount, try to load API key from cache for today
    useEffect(() => {
        const cacheRaw = localStorage.getItem(API_KEY_CACHE_KEY);
        if (cacheRaw) {
            try {
                const cache = JSON.parse(cacheRaw);
                if (cache.date === getToday() && cache.key) {
                    setApiKey(cache.key);
                }
            } catch { }
        }
    }, []);

    // Save API key to cache when it changes
    useEffect(() => {
        if (apiKey) {
            localStorage.setItem(
                API_KEY_CACHE_KEY,
                JSON.stringify({ date: getToday(), key: apiKey }),
            );
        }
    }, [apiKey]);

    // Handle Esc key to close fullscreen chart
    useEffect(() => {
        if (!fullscreenChart) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setFullscreenChart(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [fullscreenChart]);

    // Filtering logic for contracts/charts
    const filterContracts = (contracts: Contract[]): Contract[] => {
        if (filter === "none") return contracts;
        const now = new Date();
        return contracts.filter(c => {
            const days = Math.round((c.expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (filter === "week") return days >= 0 && days <= 7;
            if (filter === "month") return days >= 0 && days <= 31;
            return true;
        });
    };

    // When filter changes, reload contracts if already loaded
    useEffect(() => {
        if (!lastContractsText) return;
        loadContractsData(lastContractsText, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        const text = await file.text();
        await loadContractsData(text);
    };

    // Accepts a second arg to skip setting lastContractsText (for filter refresh)
    const loadContractsData = async (text: string, skipSetLast?: boolean) => {
        setLoading(true);
        setCharts([]); // Remove all charts before reloading
        setDragEnabled(true); // Enable drag after first load
        if (!skipSetLast) setLastContractsText(text);
        const lines = text
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
        const contracts = lines
            .map(parseContractLine)
            .filter(Boolean) as Contract[];

        // Group contracts by ticker
        const contractsByTicker: Record<string, Contract[]> = {};
        for (const c of contracts) {
            if (!contractsByTicker[c.ticker]) contractsByTicker[c.ticker] = [];
            contractsByTicker[c.ticker].push(c);
        }
        // Sort tickers ascending
        const sortedTickers = Object.keys(contractsByTicker).sort((a, b) => a.localeCompare(b));
        // Filter contracts for each ticker
        const filteredByTicker: Record<string, Contract[]> = {};
        for (const ticker of sortedTickers) {
            const filtered = filterContracts(contractsByTicker[ticker]);
            if (filtered.length > 0) filteredByTicker[ticker] = filtered;
        }
        // Only fetch tickerData for tickers with filtered contracts
        const tickerData: Record<string, { price: number; changePct: number }> = {};
        for (const ticker of Object.keys(filteredByTicker)) {
            tickerData[ticker] = await getTickerInfo(ticker, apiKey);
        }
        const chartData = Object.keys(filteredByTicker)
            .map((ticker) =>
                generateChartData(
                    ticker,
                    filteredByTicker[ticker],
                    tickerData[ticker].price,
                    tickerData[ticker].changePct,
                ),
            );
        setCharts(chartData);
        setLoading(false);
    };

    // Overlay drag-and-drop handlers
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (!file || (file.type !== "text/plain" && !file.name.endsWith(".txt"))) {
            alert("Please drop a .txt file.");
            return;
        }
        const text = await file.text();
        await loadContractsData(text);
    };

    return (
        <FluentProvider theme={officeTheme} style={{ minHeight: "100vh" }}>
            <OfficeHeader filter={filter} setFilter={setFilter} />
            <div style={{ paddingTop: 68, position: "relative" }}>
                <DragAndDropOverlay
                    dragActive={dragActive}
                    dragEnabled={dragEnabled}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <FullscreenChartModal
                        fullscreenChart={fullscreenChart}
                        onClose={() => setFullscreenChart(null)}
                    />
                    <div className="main-content">
                        {!charts.length && (
                            <>
                                <div style={{ marginBottom: 16 }}>
                                    <Label htmlFor="api-key-input">
                                        Financial Modeling{" "}
                                        <Link href="https://site.financialmodelingprep.com/developer/docs/dashboard/">
                                            API Key
                                        </Link>{" "}
                                    </Label>
                                    <Input
                                        id="api-key-input"
                                        type="text"
                                        value={apiKey}
                                        disabled={loading}
                                        onChange={(_, data) => setApiKey(data.value)}
                                        placeholder="Enter your FMP API key"
                                        style={{ width: 320 }}
                                    />
                                </div>
                                <input
                                    id="file-input"
                                    type="file"
                                    accept=".txt"
                                    style={{ display: "none" }}
                                    onChange={handleFile}
                                />
                                <Button
                                    appearance="primary"
                                    onClick={() => document.getElementById("file-input")?.click()}
                                    disabled={loading}
                                    style={{
                                        marginBottom: 16,
                                        display: "block",
                                        marginLeft: "auto",
                                        marginRight: "auto",
                                    }}
                                >
                                    Upload Contracts
                                </Button>
                            </>
                        )}
                        {loading && <Loading />}
                        <div className="charts-list">
                            {charts.map((chart) => (
                                <div
                                    key={chart.ticker}
                                    className="chart-container"
                                    style={{
                                        width: "100%",
                                        height: "400px",
                                        minWidth: 300,
                                        margin: "0 auto",
                                        position: "relative",
                                    }}
                                >
                                    <div
                                        style={{ position: "absolute", top: 8, left: 8, zIndex: 2 }}
                                    >
                                        <Menu>
                                            <MenuTrigger disableButtonEnhancement>
                                                <Button
                                                    icon={<MoreHorizontal24Regular />}
                                                    appearance="subtle"
                                                    size="small"
                                                />
                                            </MenuTrigger>
                                            <MenuPopover>
                                                <MenuList>
                                                    <MenuItem
                                                        icon={<FullScreenMaximize24Regular />}
                                                        onClick={() => setFullscreenChart(chart)}
                                                    >
                                                        Show Full Screen
                                                    </MenuItem>
                                                </MenuList>
                                            </MenuPopover>
                                        </Menu>
                                    </div>
                                    <Plot
                                        data={chart.plotData}
                                        layout={chart.layout}
                                        style={{ width: "100%", minHeight: 400, marginTop: -10 }}
                                        useResizeHandler={true}
                                        className="responsive-plot"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </DragAndDropOverlay>
            </div>
        </FluentProvider>
    );
};

export default App;
