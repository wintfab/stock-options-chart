import React from "react";

interface ChartTitleProps {
    ticker: string;
    closingPrice: number;
    priceChangePct?: number;
    fontSize?: number;
}

const ChartTitle: React.FC<ChartTitleProps> = ({ ticker, closingPrice, priceChangePct, fontSize = 18 }) => {
    const pctColor =
        priceChangePct !== undefined
            ? priceChangePct < 0
                ? "red"
                : "green"
            : undefined;
    return (
        <span style={{ fontSize, fontWeight: "bold" }}>
            {ticker} {"("}${closingPrice.toFixed(2)}
            {priceChangePct !== undefined && (
                <>
                    {", "}
                    <span style={{ color: pctColor }}>
                        {priceChangePct >= 0 ? "+" : ""}{priceChangePct.toFixed(2)}%
                    </span>
                </>
            )}
            {")"}
        </span>
    );
};

export default ChartTitle;

// Helper to render as HTML string for Plotly
export function renderChartTitleHTML(ticker: string, closingPrice: number, priceChangePct?: number, fontSize = 18) {
    const pctColor =
        priceChangePct !== undefined
            ? priceChangePct < 0
                ? "red"
                : "green"
            : undefined;
    let pctHtml = "";
    if (priceChangePct !== undefined) {
        pctHtml = `, <span style=\"color: ${pctColor}\">${priceChangePct >= 0 ? "+" : ""}${priceChangePct.toFixed(2)}%</span>`;
    }
    return `<span style=\"font-size: ${fontSize}px; font-weight: bold;\">${ticker}</span> ($${closingPrice.toFixed(2)}${pctHtml})`;
}
