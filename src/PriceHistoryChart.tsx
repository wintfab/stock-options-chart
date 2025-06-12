import React, { useEffect, useState, useMemo } from "react";
import { Dialog, DialogSurface, DialogBody, DialogTitle, DialogActions } from "@fluentui/react-components";
import { Button, TabList, Tab } from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { TickerDataController } from "./TickerDataController";
import { calculateProbabilityCones } from "./ChartModels/ProbabilityCone";
import { computeSupportResistance } from "./ChartModels/SupportResistance";
import { getToday } from "./utils";

import ChartTitle from "./ChartTitle";
import Plot from "react-plotly.js";


interface PriceHistoryChartProps {
    ticker: string;
    open: boolean;
    onClose: () => void;
    apiKey: string;
    closingPrice: number;
    priceChangePct?: number;
}

function getLocalDateString() {
    const now = new Date();
    return now.toLocaleDateString("en-CA", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
}

const FORECAST_DAYS = 30;

const PERIODS = [
    { key: "1D", label: "1D" },
    { key: "5D", label: "5D" },
    { key: "1M", label: "1M" },
    { key: "3M", label: "3M" },
    { key: "YTD", label: "YTD" },
];

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ ticker, open, onClose, apiKey, closingPrice, priceChangePct }) => {
    // Update cache type to match fetchPriceHistory return type
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[] | null>(null);
    const [ma52, setMa52] = useState<{ date: string; sma: number }[]>([]);
    const [cache, setCache] = useState<Record<string, { history: any[]; ma52: { date: string; sma: number }[] }>>({});
    const [selectedPeriod, setSelectedPeriod] = useState("3M");

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setData(null);
        setMa52([]);
        TickerDataController.fetchPriceHistory(ticker, apiKey, cache).then((result) => {
            const cacheKey = ticker + "_" + getLocalDateString();
            setCache((prev) => ({ ...prev, [cacheKey]: result }));
            setData(result.history);
            setMa52(result.ma52);
            setLoading(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, ticker, apiKey]);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    // Filter data based on selected period
    const filteredData = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) return [];
        const now = new Date();
        let fromDate: Date | null = null;
        switch (selectedPeriod) {
            case "1D":
                fromDate = new Date(now);
                fromDate.setDate(now.getDate() - 1);
                break;
            case "5D":
                fromDate = new Date(now);
                fromDate.setDate(now.getDate() - 5);
                break;
            case "1M":
                fromDate = new Date(now);
                fromDate.setMonth(now.getMonth() - 1);
                break;
            case "3M":
                fromDate = new Date(now);
                fromDate.setMonth(now.getMonth() - 3);
                break;
            case "YTD":
                fromDate = new Date(now.getFullYear(), 0, 1); // Always Jan 1st of current year
                break;
            default:
                return data;
        }
        return data.filter(d => new Date(d.date) >= fromDate!);
    }, [data, selectedPeriod]);

    return (
        <Dialog open={open} modalType="modal">
            <DialogSurface
                style={{
                    width: 1000,
                    height: 640, // increased from 600
                    maxWidth: '90vw',
                    maxHeight: '96vh' // increased from 90vh
                }}
            >
                <DialogTitle>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, position: "relative", width: "100%" }}>
                        <ChartTitle
                            ticker={ticker}
                            closingPrice={closingPrice}
                            priceChangePct={priceChangePct}
                            fontSize={18}
                        />
                        <Button
                            appearance="subtle"
                            icon={<Dismiss24Regular />}
                            onClick={onClose}
                            style={{ position: "absolute", top: 8, right: 8 }}
                            aria-label="Close"
                        />
                    </div>
                </DialogTitle>

                <DialogBody style={{ height: "calc(100% - 16px)", display: "flex", flexDirection: "column", padding: 0 }}>
                    {loading ? (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.3 }}>
                            <img src="/vite.svg" alt="Loading ghost" style={{ width: 120, height: 120, filter: "grayscale(1)" }} />
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            {/* Period Selector using FluentUI TabList */}
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "8px 0 0 0" }}>
                                <TabList selectedValue={selectedPeriod} onTabSelect={(_, data) => setSelectedPeriod(data.value as string)}>
                                    {PERIODS.map(period => (
                                        <Tab key={period.key} value={period.key}>{period.label}</Tab>
                                    ))}
                                </TabList>
                            </div>
                            <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
                                {Array.isArray(filteredData) && filteredData.length > 0 ? (
                                    (() => {
                                        // Prepare price and date arrays
                                        const priceArr = filteredData.map(d => d.close).reverse(); // oldest to newest
                                        const dateArr = filteredData.map(d => new Date(d.date)).reverse();
                                        // Probability cone config
                                        const lookback = Math.min(FORECAST_DAYS, priceArr.length - 1);
                                        const forecastBars = FORECAST_DAYS;
                                        const anchorIndex = priceArr.length - 1; // last (most recent)
                                        const input = {
                                            source: priceArr,
                                            deviation: "Standard" as const,
                                            meanMethod: "Auto" as const,
                                            lookback,
                                            forecastBars,
                                            drift: true,
                                            anchorIndex,
                                            anchorOpen: false,
                                            deviations: {
                                                firstUpper: 1,
                                                firstLower: 1,
                                                secondUpper: 2,
                                                secondLower: 2,
                                                thirdUpper: 3,
                                                thirdLower: 3,
                                            },
                                        };
                                        const cones = calculateProbabilityCones(input);
                                        // X values for cones: extend dates into the future
                                        const lastDate = dateArr[dateArr.length - 1];
                                        const coneDates = Array.from({ length: forecastBars + 1 }, (_, i) => {
                                            const d = new Date(lastDate);
                                            d.setDate(d.getDate() + i);
                                            return d;
                                        });
                                        // --- Support/Resistance ---
                                        // Convert data to OHLCV for computeSupportResistance
                                        const ohlcv = filteredData.map(d => ({
                                            open: d.open,
                                            high: d.high,
                                            low: d.low,
                                            close: d.close,
                                            volume: d.volume ?? 0,
                                        })).reverse(); // oldest to newest
                                        const sr = computeSupportResistance(ohlcv, 15, 15);

                                        // --- 52-day Moving Average ---
                                        // Find the min and max date in the price data
                                        const priceDates = filteredData.map(d => d.date);
                                        const minDate = priceDates[priceDates.length - 1];
                                        const maxDate = priceDates[0];

                                        // Filter MA points to only those within the price data date range
                                        const filteredMA = ma52.filter(ma => ma.date >= minDate && ma.date <= maxDate);

                                        // Plot traces
                                        const traces: Plotly.Data[] = [
                                            {
                                                x: filteredData.map(d => new Date(d.date)),
                                                y: filteredData.map(d => d.close),
                                                type: "scatter" as const,
                                                mode: "lines+markers" as const,
                                                name: ticker,
                                                line: { color: "#0F6CBD", width: 2 },
                                                marker: { color: "#0F6CBD", size: 6 },
                                                hovertemplate: `<b>Date:</b> %{x|%b %d}<br><b>Price:</b> $%{y:.2f}<extra></extra>`
                                            },
                                            // Probability cones (shaded areas)
                                            {
                                                x: coneDates.concat([...coneDates].reverse()),
                                                y: cones.firstUpper.concat([...cones.firstLower].reverse()),
                                                fill: "toself" as const,
                                                fillcolor: "rgba(15,108,189,0.10)",
                                                line: { color: "rgba(15,108,189,0.15)", width: 0 },
                                                type: "scatter" as const,
                                                mode: "lines" as const,
                                                name: "68% Cone",
                                                hoverinfo: "skip" as const,
                                                showlegend: true,
                                            },
                                            {
                                                x: coneDates.concat([...coneDates].reverse()),
                                                y: cones.secondUpper.concat([...cones.secondLower].reverse()),
                                                fill: "toself" as const,
                                                fillcolor: "rgba(15,108,189,0.07)",
                                                line: { color: "rgba(15,108,189,0.10)", width: 0 },
                                                type: "scatter" as const,
                                                mode: "lines" as const,
                                                name: "95% Cone",
                                                hoverinfo: "skip" as const,
                                                showlegend: true,
                                            },
                                            {
                                                x: coneDates.concat([...coneDates].reverse()),
                                                y: cones.thirdUpper.concat([...cones.thirdLower].reverse()),
                                                fill: "toself" as const,
                                                fillcolor: "rgba(15,108,189,0.04)",
                                                line: { color: "rgba(15,108,189,0.07)", width: 0 },
                                                type: "scatter" as const,
                                                mode: "lines" as const,
                                                name: "99.7% Cone",
                                                hoverinfo: "skip" as const,
                                                showlegend: true,
                                            },
                                            // Mean forecast line
                                            {
                                                x: coneDates,
                                                y: cones.mean,
                                                type: "scatter" as const,
                                                mode: "lines" as const,
                                                name: "Forecast Mean",
                                                line: { color: "#0F6CBD", dash: "dot" as const, width: 2 },
                                                hoverinfo: "skip" as const,
                                                showlegend: true,
                                            },
                                            // Resistance levels
                                            ...sr.resistances.map((lvl): Plotly.Data => ({
                                                x: [filteredData[filteredData.length - 1 - lvl.index]?.date, filteredData[0]?.date].map((d: string | undefined) => d ? new Date(d) : new Date()),
                                                y: [lvl.price, lvl.price],
                                                type: "scatter",
                                                mode: "lines",
                                                name: "Resistance",
                                                line: { color: "#FF0000", width: 2, dash: "dash" },
                                                hoverinfo: "none",
                                                showlegend: false,
                                            })),
                                            // Support levels
                                            ...sr.supports.map((lvl): Plotly.Data => ({
                                                x: [filteredData[filteredData.length - 1 - lvl.index]?.date, filteredData[0]?.date].map(d => d ? new Date(d) : new Date()),
                                                y: [lvl.price, lvl.price],
                                                type: "scatter",
                                                mode: "lines",
                                                name: "Support",
                                                line: { color: "#42ff00", width: 2, dash: "dot" },
                                                hoverinfo: "none",
                                                showlegend: false,
                                            })),
                                            // 52-day MA line (only for the range of available price data)
                                            {
                                                x: filteredMA.map(ma => new Date(ma.date)),
                                                y: filteredMA.map(ma => ma.sma),
                                                type: "scatter",
                                                mode: "lines",
                                                name: "52-day MA",
                                                line: { color: "rgba(30,30,30,0.5)", width: 2 },
                                                hovertemplate: `<b>Date:</b> %{x|%b %d}<br><b>52d MA:</b> $%{y:.2f}<extra></extra>`,
                                                showlegend: true,
                                            },
                                        ];
                                        return (
                                            <Plot
                                                data={traces}
                                                layout={{
                                                    autosize: true,
                                                    margin: { t: 16, r: 48, b: 48, l: 64 },
                                                    xaxis: {
                                                        type: "date" as const,
                                                        tickangle: -45,
                                                        tickformat: "%b %d",
                                                        dtick: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
                                                        ticklabelmode: "period",
                                                    },
                                                    yaxis: {
                                                        title: { text: "Price ($)" },
                                                        tickprefix: "$"
                                                    },
                                                    showlegend: true,
                                                    legend: { orientation: "h", y: -0.18 },
                                                    plot_bgcolor: "#fff",
                                                    paper_bgcolor: "#fff",
                                                    hovermode: "closest"
                                                }}
                                                style={{ width: "100%", height: "100%" }}
                                                config={{
                                                    responsive: true,
                                                    staticPlot: false,
                                                    toImageButtonOptions: {
                                                        filename: `${ticker}_${getToday()}_price_history`,
                                                        format: "png",
                                                        width: 1200,
                                                        height: 800,
                                                        scale: 2,
                                                    }
                                                }}
                                                useResizeHandler={true}
                                            />
                                        );
                                    })()
                                ) : (
                                    <div style={{ textAlign: "center", color: "#888", width: "100%", alignSelf: "center" }}>
                                        No price history data available
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogBody>
                <DialogActions />
            </DialogSurface>
        </Dialog>
    );
};

export default PriceHistoryChart;