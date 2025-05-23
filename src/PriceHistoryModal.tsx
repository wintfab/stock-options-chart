import React, { useEffect, useState } from "react";
import { Dialog, DialogSurface, DialogBody, DialogTitle, DialogActions } from "@fluentui/react-components";
import { Button } from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { TickerDataController } from "./TickerDataController";
import ChartTitle from "./ChartTitle";
import Plot from "react-plotly.js";

interface PriceHistoryModalProps {
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

const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({ ticker, open, onClose, apiKey, closingPrice, priceChangePct }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[] | null>(null);
    const [cache, setCache] = useState<Record<string, any[]>>({});

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setData(null);
        TickerDataController.fetchPriceHistory(ticker, apiKey, cache).then((result) => {
            const cacheKey = ticker + "_" + getLocalDateString();
            setCache((prev) => ({ ...prev, [cacheKey]: result }));
            setData(result);
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

    return (
        <Dialog open={open} modalType="modal">
            <DialogSurface 
                style={{ 
                    width: 800,
                    height: 600,
                    maxWidth: '90vw',
                    maxHeight: '90vh'
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
                <DialogBody style={{ height: "calc(100% - 64px)" }}>
                    {loading ? (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.3 }}>
                            <img src="/vite.svg" alt="Loading ghost" style={{ width: 120, height: 120, filter: "grayscale(1)" }} />
                        </div>
                    ) : (
                        <div style={{ width: "100%", height: "100%", display: "contents" }}>
                            {Array.isArray(data) && data.length > 0 ? (
                                <Plot
                                    data={[{
                                        x: data.map(d => new Date(d.date)),
                                        y: data.map(d => d.close),
                                        type: "scatter" as const,
                                        mode: "lines+markers" as const,
                                        name: ticker,
                                        line: { color: "#0F6CBD", width: 2 },
                                        marker: { color: "#0F6CBD", size: 6 },
                                        hovertemplate: `<b>Date:</b> %{x|%b %d}<br><b>Price:</b> $%{y:.2f}<extra></extra>`
                                    }]}
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
                                        showlegend: false,
                                        plot_bgcolor: "#fff",
                                        paper_bgcolor: "#fff",
                                        hovermode: "closest"
                                    }}
                                    style={{ width: "100%", height: "calc(100% - 16px)" }}
                                    config={{ displayModeBar: false, responsive: true, staticPlot: false }}
                                    useResizeHandler={true}
                                />
                            ) : (
                                <div style={{ textAlign: "center", color: "#888" }}>
                                    No price history data available
                                </div>
                            )}
                        </div>
                    )}
                </DialogBody>
                <DialogActions />
            </DialogSurface>
        </Dialog>
    );
};

export default PriceHistoryModal;