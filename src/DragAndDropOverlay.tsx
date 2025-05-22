import React from "react";
import { Attach24Regular } from "@fluentui/react-icons";

interface DragAndDropOverlayProps {
    dragActive: boolean;
    dragEnabled: boolean;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    children: React.ReactNode;
}

const DragAndDropOverlay: React.FC<DragAndDropOverlayProps> = ({
    dragActive,
    dragEnabled,
    onDragOver,
    onDragLeave,
    onDrop,
    children,
}) => (
    <div
        onDragOver={dragEnabled ? onDragOver : undefined}
        onDragLeave={dragEnabled ? onDragLeave : undefined}
        onDrop={dragEnabled ? onDrop : undefined}
        style={{ position: "relative", minHeight: "100vh" }}
    >
        {dragActive && dragEnabled && (
            <div className="drag-overlay">
                <div className="drag-overlay-inner">
                    <Attach24Regular style={{ fontSize: 64, color: "#fff", marginBottom: 16 }} />
                    <div className="drag-overlay-text">
                        Drop your <b>.txt</b> file here
                    </div>
                </div>
            </div>
        )}
        {children}
    </div>
);

export default DragAndDropOverlay;
