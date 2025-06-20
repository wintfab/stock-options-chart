// Copyright (c) 2025 fwinter. All rights reserved.

import React, { useState, useEffect } from "react";
import {
    Button,
    Input,
    Label,
    Link} from "@fluentui/react-components";
import type { BrandVariants } from "@fluentui/react-components";
import {
    createLightTheme,
    FluentProvider,
} from "@fluentui/react-components";
import "./App.css";
import OfficeHeader from "./OfficeHeader";
import FullscreenChart from "./FullscreenChart";
import DragAndDropOverlay from "./DragAndDropOverlay";
import Loading from "./Loading";
import TickerError from "./TickerError";
import PriceHistoryChart from "./PriceHistoryChart"
import LastCacheUpdateLabel from "./LastCacheUpdateLabel";
import { getToday, parseContractLine, calculateDaysUntilExpiration } from "./utils";
import { TickerDataController } from "./TickerDataController";
import { renderChartTitleHTML } from "./ChartTitle";
import SelectionSidePanel from "./SelectionSidePanel";
import ChartCard from "./ChartCard";

const API_KEY_CACHE_KEY = "fmp_api_key_cache";

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
    closingPrice: number;
    priceChangePct?: number;
}

function generateChartData(
    ticker: string,
    contracts: Contract[],
    closingPrice: number,
    priceChangePct?: number,
): ChartData {
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
        const pct = c.strike < closingPrice ? -Math.abs(diff) : diff;
        const expDate = c.expiration.toLocaleDateString();
        return [expDate, `$${c.strike.toFixed(2)}`, `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`];
    });

    // For puts: negative % if strike > closingPrice
    const putHover = puts.map((p) => {
        const diff = ((closingPrice - p.strike) / closingPrice) * 100;
        const pct = p.strike > closingPrice ? -Math.abs(diff) : diff;
        const expDate = p.expiration.toLocaleDateString();
        return [expDate, `$${p.strike.toFixed(2)}`, `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`];
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
        customdata: callHover,
        hovertemplate: `
    <b>Exp:</b> %{customdata[0]} <br>
    <b>Price:</b> %{customdata[1]} <br>
    <b>Diff:</b> %{customdata[2]}
    `,
    };

    const putTrace = {
        x: puts.map((c) => calculateDaysUntilExpiration(c.expiration)),
        y: puts.map((c) => c.strike),
        mode: "markers",
        type: "scatter",
        name: "Put",
        marker: { color: "purple", size: 10, symbol: putSymbols },
        customdata: putHover,
        hovertemplate: `
    <b>Exp:</b> %{customdata[0]} <br>
    <b>Price:</b> %{customdata[1]} <br>
    <b>Diff:</b> %{customdata[2]}
    `,
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
        name: `Closing`,
        line: { color: priceLineColor, dash: "dash" },
    };

    const plotData = [callTrace, putTrace, priceLine].filter(
        (trace) => trace.x.length > 0,
    );

    const uniqueDays = Array.from(new Set(days)).sort((a, b) => a - b);

    const layout = {
        title: {
            text: renderChartTitleHTML(ticker, closingPrice, priceChangePct),
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

    return { ticker, plotData, layout, closingPrice, priceChangePct };
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
    const [tickerError, setTickerError] = useState<null | { tickers: string[] }>(null);
    const [priceHistoryChartState, setPriceHistoryChartState] = useState<{
        ticker: string;
        closingPrice: number;
        priceChangePct?: number;
    } | null>(null);
    const [lastCacheUpdate, setLastCacheUpdate] = useState<string | null>(null);
    const [selectedPoint, setSelectedPoint] = useState<{
        ticker: string;
        type: string;
        expDate: string;
        strike: string;
        diff: string;
    } | null>(null);
    const [sidePanelOpen, setSidePanelOpen] = useState(true);

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

    // On mount, check for last cache update
    useEffect(() => {
        const lastUpdate = localStorage.getItem('fmp_quote_cache_last_update');
        if (lastUpdate) setLastCacheUpdate(lastUpdate);
    }, []);

    // After data is fully loaded, update last cache update state
    useEffect(() => {
        if (!loading && charts.length > 0) {
            const lastUpdate = localStorage.getItem('fmp_quote_cache_last_update');
            if (lastUpdate) setLastCacheUpdate(lastUpdate);
        }
    }, [loading, charts]);

    // Filtering logic for contracts/charts
    const filterContracts = (contracts: Contract[]): Contract[] => {
        if (filter === "none") return contracts;
        if (filter === "week") return contracts.filter(c => {
            const days = calculateDaysUntilExpiration(c.expiration);
            return days >= 0 && days <= 7;
        });
        if (filter === "month") return contracts.filter(c => {
            const days = calculateDaysUntilExpiration(c.expiration);
            return days >= 0 && days <= 31;
        });
        if (filter === "warning") {
            // Only include tickers where all CALLs are below or equal to price and all PUTs are above or equal to price
            // Need to know the closing price for this ticker
            // Find the closing price from tickerData if available
            // This function is called per ticker's contracts array, but we need to pass closingPrice in context
            // We'll handle this in the chart filtering logic below, not here
            return contracts;
        }
        return contracts;
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
        setTickerError(null); // Reset error state
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
            tickerData[ticker] = await TickerDataController.getTickerInfo(ticker, apiKey);
        }
        // Check for tickers with price $0
        const zeroPriceTickers = Object.entries(tickerData)
            .filter(([_, v]) => v.price === 0)
            .map(([k]) => k);
        if (zeroPriceTickers.length > 0) {
            setTickerError({ tickers: zeroPriceTickers });
            setLoading(false);
            return;
        }
        // Strict filter: remove tickers that don't meet the warning criteria
        let finalTickers = Object.keys(filteredByTicker);
        if (filter === "warning") {
            finalTickers = finalTickers.filter(ticker => {
                const contracts = filteredByTicker[ticker];
                const closingPrice = tickerData[ticker].price;
                const hasCallBelow = contracts.some(c => c.type === "CALL" && c.strike <= closingPrice);
                const hasPutAbove = contracts.some(c => c.type === "PUT" && c.strike > closingPrice);
                return hasCallBelow || hasPutAbove;
            });
        }
        const chartData = finalTickers
            .map((ticker) =>
                generateChartData(
                    ticker,
                    filteredByTicker[ticker],
                    tickerData[ticker].price,
                    tickerData[ticker].changePct,
                ),
            );
        setSidePanelOpen(false); // Close panel by default when data is loaded
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

    // Helper to handle selection and always expand the side panel
    const handleSelectPoint = (point: {
        ticker: string;
        type: string;
        expDate: string;
        strike: string;
        diff: string;
    }) => {
        setSelectedPoint(point);
        setSidePanelOpen(true); // Ensure panel is expanded on selection
    };

    const dataLoaded = charts.length > 0 && !loading && !tickerError;

    return (
        <FluentProvider theme={officeTheme} style={{ minHeight: "100vh" }}>
            <OfficeHeader filter={filter} setFilter={setFilter} disabled={!charts.length || !!tickerError} />
            <div style={{ paddingTop: 68, position: "relative" }}>
                <DragAndDropOverlay
                    dragActive={dragActive}
                    dragEnabled={dragEnabled}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <FullscreenChart
                        fullscreenChart={fullscreenChart}
                        onClose={() => setFullscreenChart(null)}
                    />
                    <PriceHistoryChart
                        ticker={priceHistoryChartState?.ticker || ""}
                        open={!!priceHistoryChartState}
                        onClose={() => setPriceHistoryChartState(null)}
                        apiKey={apiKey}
                        closingPrice={priceHistoryChartState?.closingPrice || 0}
                        priceChangePct={priceHistoryChartState?.priceChangePct}
                    />
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "stretch" }}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: dataLoaded && sidePanelOpen ? 340 : 60 }}>
                            <div className="main-content">
                                {tickerError ? (
                                    <TickerError
                                        tickers={tickerError.tickers}
                                        onRetry={() => lastContractsText && loadContractsData(lastContractsText)}
                                    />
                                ) : (
                                    <>
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
                                                <ChartCard
                                                    key={chart.ticker}
                                                    chart={chart}
                                                    onShowPriceHistory={(chart) => {
                                                        setPriceHistoryChartState({
                                                            ticker: chart.ticker,
                                                            closingPrice: chart.closingPrice,
                                                            priceChangePct: chart.priceChangePct
                                                        });
                                                    }}
                                                    onShowFullScreen={setFullscreenChart}
                                                    onSelectPoint={handleSelectPoint}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Side Panel */}
                    {dataLoaded && (
                        <SelectionSidePanel
                            open={sidePanelOpen}
                            onToggle={() => setSidePanelOpen((open) => !open)}
                            selectedPoint={selectedPoint}
                            onClearSelection={() => setSelectedPoint(null)}
                            headerTop={56} // Match OfficeHeader height
                        />
                    )}
                </DragAndDropOverlay>
                <LastCacheUpdateLabel lastCacheUpdate={lastCacheUpdate} />
            </div>
        </FluentProvider>
    );
};

export default App;
