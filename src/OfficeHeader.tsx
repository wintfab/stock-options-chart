import React from "react";
import { Title3 } from "@fluentui/react-components";

const OfficeHeader: React.FC = () => (
    <header className="office-header">
        <img src="/vite.svg" alt="App Logo" style={{ height: 32 }} />
        <Title3
            as="h1"
            style={{
                color: "white",
                fontWeight: 600,
                letterSpacing: 0.5,
                margin: 0,
                flex: "0 1 auto",
            }}
        >
            Stock Options Analysis
        </Title3>
    </header>
);

export default OfficeHeader;
