// Copyright (c) 2025 fwinter. All rights reserved.

import React from "react";
import Plot from "react-plotly.js";
import { Button } from "@fluentui/react-components";
import { FullScreenMaximize24Regular } from "@fluentui/react-icons";
import { getToday } from "./utils";

interface FullscreenChartModalProps {
    fullscreenChart: any;
    onClose: () => void;
}

const FullscreenChartModal: React.FC<FullscreenChartModalProps> = ({ fullscreenChart, onClose }) => {
    if (!fullscreenChart) return null;
    return (
        <div className="fullscreen-modal" onClick={onClose}>
            <div className="fullscreen-modal-inner" onClick={e => e.stopPropagation()}>
                <div
                    style={{
                        position: "absolute",
                        top: 16,
                        left: 16,
                        zIndex: 10,
                        display: "flex",
                        gap: 8,
                    }}
                >
                    <Button
                        icon={<FullScreenMaximize24Regular />}
                        appearance="subtle"
                        onClick={onClose}
                        aria-label="Close Full Screen"
                    />
                </div>
                <Plot
                    data={fullscreenChart.plotData}
                    layout={{
                        ...fullscreenChart.layout,
                        autosize: true,
                        width: undefined,
                        height: undefined,
                        paper_bgcolor: "#181c24",
                        plot_bgcolor: "#181c24",
                        legend: {
                            ...fullscreenChart.layout.legend,
                            bgcolor: "#a3a7ae",
                        },
                        xaxis: {
                            ...fullscreenChart.layout.xaxis,
                            gridcolor: "#8d9198", // lighter grid for dark bg
                        },
                        yaxis: {
                            ...fullscreenChart.layout.yaxis,
                            gridcolor: "#8d9198", // lighter grid for dark bg
                        },
                    }}
                    style={{ width: "90vw", height: "90vh", minHeight: 500 }}
                    useResizeHandler={true}
                    className="responsive-plot"
                    config={{
                        toImageButtonOptions: {
                            filename: `${fullscreenChart.ticker}_${getToday()}`,
                            format: "png",
                            width: 1200,
                            height: 800,
                            scale: 2,
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default FullscreenChartModal;
