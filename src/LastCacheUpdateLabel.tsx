import React from "react";

interface LastCacheUpdateLabelProps {
    lastCacheUpdate: string | null;
}

const LastCacheUpdateLabel: React.FC<LastCacheUpdateLabelProps> = ({ lastCacheUpdate }) => {
    if (!lastCacheUpdate) return null;
    return (
        <div
            style={{
                position: "fixed",
                right: 24,
                bottom: 16,
                color: "#888",
                background: "#f3f3f3",
                borderRadius: 6,
                fontSize: 13,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                padding: "6px 16px",
                zIndex: 1000,
                pointerEvents: "none",
                border: "1px solid #e0e0e0",
                fontStyle: "italic",
                opacity: 0.7,
                userSelect: "none",
            }}
            aria-disabled="true"
        >
            Last cache update: {new Date(lastCacheUpdate).toLocaleString()}
        </div>
    );
};

export default LastCacheUpdateLabel;
