// Copyright (c) 2025 fwinter. All rights reserved.

import React from "react";
import Plot from "react-plotly.js";
import {
    Menu,
    MenuItem,
    MenuList,
    MenuPopover,
    MenuTrigger,
    Button,
} from "@fluentui/react-components";
import { GanttChart24Regular, FullScreenMaximize24Regular, MoreHorizontal24Regular } from "@fluentui/react-icons";
import { getToday } from "./utils";

interface ChartCardProps {
    chart: {
        ticker: string;
        plotData: any[];
        layout: any;
        closingPrice: number;
        priceChangePct?: number;
    };
    onShowPriceHistory: (chart: any) => void;
    onShowFullScreen: (chart: any) => void;
    onSelectPoint: (point: {
        ticker: string;
        type: string;
        expDate: string;
        strike: string;
        diff: string;
    }) => void;
}

const ChartCard: React.FC<ChartCardProps> = ({
    chart,
    onShowPriceHistory,
    onShowFullScreen,
    onSelectPoint,
}) => (
    <div
        className="chart-container"
        style={{
            width: "min(900px, 98vw)",
            minWidth: 320,
            height: "400px",
            margin: "0 auto 32px auto",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
            borderRadius: 8,
            boxSizing: "border-box",
        }}
    >
        <div style={{ position: "absolute", top: 8, left: 8, zIndex: 2 }}>
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
                            icon={<GanttChart24Regular />}
                            onClick={() => onShowPriceHistory(chart)}
                        >
                            Show Price History
                        </MenuItem>
                        <MenuItem
                            icon={<FullScreenMaximize24Regular />}
                            onClick={() => onShowFullScreen(chart)}
                        >
                            Show Full Screen
                        </MenuItem>
                    </MenuList>
                </MenuPopover>
            </Menu>
        </div>
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plot
                data={chart.plotData}
                layout={{ ...chart.layout, autosize: true, width: undefined, height: undefined }}
                style={{ width: "100%", height: "100%", minHeight: 400, marginTop: -10 }}
                useResizeHandler={true}
                className="responsive-plot"
                config={{
                    toImageButtonOptions: {
                        filename: `${chart.ticker}_${getToday()}`,
                        format: "png",
                        width: 1200,
                        height: 800,
                        scale: 2,
                    }
                }}
                onClick={(event) => {
                    const pt = event.points[0];
                    const [expDate, strike, diff] = Array.isArray(pt.customdata) ? pt.customdata : [];
                    onSelectPoint({
                        ticker: chart.ticker,
                        type: pt.data.name,
                        expDate,
                        strike,
                        diff
                    });
                }}
            />
        </div>
    </div>
);

export default ChartCard;