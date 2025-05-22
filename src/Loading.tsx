// Copyright (c) 2025 fwinter. All rights reserved.

import React from "react";
import { Spinner } from "@fluentui/react-components";

const Loading: React.FC = () => (
    <div style={{ marginTop: 16 }}>
        <Spinner label="Loading chart data..." />
    </div>
);

export default Loading;
