// Copyright (c) 2025 fwinter. All rights reserved.

import React from "react";
import { Button } from "@fluentui/react-components";

interface TickerErrorProps {
    tickers: string[];
    onRetry: () => void;
}

const TickerError: React.FC<TickerErrorProps> = ({ tickers, onRetry }) => (
    <div
        style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 320,
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            margin: "40px auto 0 auto",
            maxWidth: 500,
            padding: 32,
        }}
    >
        <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            style={{ marginBottom: 16 }}
        >
            <circle cx="32" cy="32" r="32" fill="#FDE7E9" />
            <path d="M32 18v18" stroke="#D13438" strokeWidth="4" strokeLinecap="round" />
            <circle cx="32" cy="44" r="2.5" fill="#D13438" />
        </svg>
        <div
            style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#323130",
                marginBottom: 8,
            }}
        >
            Something went wrong
        </div>
        <div style={{ color: "#605E5C", marginBottom: 16, textAlign: "center" }}>
            {tickers.length === 1
                ? `The ticker "${tickers[0]}" returned a price of $0. This usually means the ticker is invalid, delisted, or the data provider is temporarily unavailable.`
                : `The following tickers returned a price of $0: ${tickers.join(", ")}. This usually means these tickers are invalid, delisted, or the data provider is temporarily unavailable.`}
        </div>
        <Button appearance="primary" onClick={onRetry}>
            Retry
        </Button>
    </div>
);

export default TickerError;
