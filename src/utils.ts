// Copyright (c) 2025 fwinter. All rights reserved.

// Utility functions for stocks app

export function getToday(): string {
    const d = new Date();
    // Return YYYY-MM-DD in local time, not UTC
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function parseContractLine(line: string) {
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

// Calculate days until expiration (date difference in days, local timezone, ignoring time)
export function calculateDaysUntilExpiration(expiration: Date): number {
    const now = new Date();
    // Zero out time for both dates to compare only the date part
    const localNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const localExp = new Date(expiration.getFullYear(), expiration.getMonth(), expiration.getDate());
    const diffTime = localExp.getTime() - localNow.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
}
