import React from "react";
import {
    Card,
    CardHeader,
    Text,
    Divider,
    Button,
    Tooltip,
} from "@fluentui/react-components";
import {
    PanelLeftExpand24Regular,
    PanelRight24Regular,
    EraserTool24Regular,
} from "@fluentui/react-icons";
import selectClear from "./assets/select-clear.svg"

interface SelectedPoint {
    ticker: string;
    type: string;
    expDate: string;
    strike: string;
    diff: string;
}

interface SelectionSidePanelProps {
    open: boolean;
    onToggle: () => void;
    selectedPoint: SelectedPoint | null;
    onClearSelection: () => void;
    headerTop?: number; // px, default 56
}

const SelectionSidePanel: React.FC<SelectionSidePanelProps> = ({
    open,
    onToggle,
    selectedPoint,
    onClearSelection,
    headerTop = 56,
}) => (
    <div
        style={{
            position: "fixed",
            top: headerTop,
            right: 0,
            height: `calc(100vh - ${headerTop}px)`,
            zIndex: 20,
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
        }}
    >
        <div
            style={{
                width: open ? 320 : 0,
                minWidth: open ? 220 : 0,
                maxWidth: open ? 400 : 0,
                background: open ? "#f3f3f3" : "transparent",
                borderLeft: open ? "1px solid #e0e0e0" : "none",
                boxShadow: open ? "0 0 8px 0 rgba(0,0,0,0.04)" : "none",
                padding: open ? 20 : 0,
                transition: "all 0.2s cubic-bezier(.4,1.2,.4,1)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                alignItems: "flex-start",
            }}
        >
            {open && (
                <Card
                    appearance="subtle"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 20,
                        position: "relative",
                        width: "100%",
                        boxSizing: "border-box",
                        padding: 0,
                        minWidth: 0,
                    }}
                >
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        gap: 12,
                    }}>
                        <CardHeader
                            header={<Text weight="semibold" size={400}>Selection Manager</Text>}
                        />
                        {selectedPoint && (
                            <Tooltip content="Clear selection" relationship="label">
                                <Button
                                    icon={<EraserTool24Regular />}
                                    onClick={onClearSelection}
                                    appearance="subtle"
                                    size="small"
                                    style={{ minWidth: 0, padding: 0, marginLeft: 8 }}
                                    aria-label="Clear selection"
                                />
                            </Tooltip>
                        )}
                    </div>
                    <Divider style={{ width: "100%" }} />
                    <div style={{ width: "100%" }}>
                        {selectedPoint ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <Text block><b>Ticker:</b> {selectedPoint.ticker}</Text>
                                <Text block><b>Type:</b> {selectedPoint.type}</Text>
                                <Text block><b>Expiration:</b> {selectedPoint.expDate}</Text>
                                <Text block><b>Strike:</b> {selectedPoint.strike}</Text>
                                <Text block><b>Diff:</b> {selectedPoint.diff}</Text>
                            </div>
                        ) : (
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                            }}>
                                <img
                                    src={selectClear}
                                    alt="No selection"
                                    style={{ width: 80, height: 80, opacity: 0.5, marginBottom: 16 }}
                                />
                                <Text style={{ color: "#888", textAlign: "center" }}>
                                    Click a chart dot to see details here.
                                </Text>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
        {/* Collapse/Expand Button */}
        <div
            style={{
                width: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f3f3f3",
                borderLeft: "1px solid #e0e0e0",
                height: "100%",
                cursor: "pointer",
                transition: "background 0.2s",
            }}
        >
            <Tooltip content={open ? "Collapse" : "Expand"} relationship="label">
                <Button
                    icon={open ? <PanelLeftExpand24Regular /> : <PanelRight24Regular />}
                    onClick={onToggle}
                    appearance="subtle"
                    size="small"
                    style={{ minWidth: 0, padding: 0 }}
                    aria-label={open ? "Collapse side panel" : "Expand side panel"}
                />
            </Tooltip>
        </div>
    </div>
);

export default SelectionSidePanel;