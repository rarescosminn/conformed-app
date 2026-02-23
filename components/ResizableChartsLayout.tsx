// components/ResizableChartsLayout.tsx
"use client";

import * as React from "react";

type Props = {
    top: React.ReactNode;
    bottomLeft: React.ReactNode;
    bottomRight: React.ReactNode;
};

/** Limite mai ridicate (safe) */
const INIT_TOP_H = 360;      // înălțimea inițială sus
const MIN_TOP_H = 340;      // minim sus (nu mai coborâm sub atât)
const MIN_BOTTOM_H = 300;    // minim total zona de jos

const INIT_BOTTOM_SPLIT = 0.60; // 60% stânga / 40% dreapta
const MIN_LEFT_W = 0.48;       // minim stânga 48%
const MIN_RIGHT_W = 0.38;       // minim dreapta 38% (suma cu stânga < 1)

export default function ResizableChartsLayout({ top, bottomLeft, bottomRight }: Props) {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [topH, setTopH] = React.useState(INIT_TOP_H);
    const [split, setSplit] = React.useState(INIT_BOTTOM_SPLIT);
    const [dragRow, setDragRow] = React.useState(false);
    const [dragCol, setDragCol] = React.useState(false);

    React.useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();

            // redimensionare pe orizontală (între cele două grafice de jos)
            if (dragCol) {
                const x = e.clientX - rect.left;
                let next = x / rect.width;
                // aplicăm limitele: nu lăsăm să treacă sub minim
                if (next < MIN_LEFT_W) next = MIN_LEFT_W;
                if (next > 1 - MIN_RIGHT_W) next = 1 - MIN_RIGHT_W;
                setSplit(next);
            }

            // redimensionare pe verticală (între graficul de sus și zona de jos)
            if (dragRow) {
                const y = e.clientY - rect.top;
                // spațiu disponibil pentru top ca să rămână MIN_BOTTOM_H jos
                const maxTop = rect.height - MIN_BOTTOM_H - 12; // 12 = grosimea separatorului
                let next = y;
                if (next < MIN_TOP_H) next = MIN_TOP_H;
                if (next > maxTop) next = maxTop;
                setTopH(next);
            }
        };

        const onUp = () => {
            if (dragRow) setDragRow(false);
            if (dragCol) setDragCol(false);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [dragRow, dragCol]);

    const resetLayout = () => {
        setTopH(INIT_TOP_H);
        setSplit(INIT_BOTTOM_SPLIT);
    };

    return (
        <div ref={containerRef} style={styles.wrap}>
            {/* sus */}
            <div style={{ ...styles.top, height: topH }}>{top}</div>

            {/* separator orizontal */}
            <div
                title="Trage pentru a redimensiona"
                onMouseDown={() => setDragRow(true)}
                onDoubleClick={resetLayout}
                style={styles.hSeparator}
            />

            {/* jos: două coloane */}
            <div style={{ ...styles.bottom, height: `calc(100% - ${topH + 12}px)` }}>
                <div
                    style={{
                        ...styles.bottomLeft,
                        width: `calc(${(split * 100).toFixed(2)}% - 4px)`,
                    }}
                >
                    {bottomLeft}
                </div>

                <div
                    title="Trage pentru a redimensiona"
                    onMouseDown={() => setDragCol(true)}
                    onDoubleClick={resetLayout}
                    style={styles.vSeparator}
                />

                <div
                    style={{
                        ...styles.bottomRight,
                        width: `calc(${((1 - split) * 100).toFixed(2)}% - 4px)`,
                    }}
                >
                    {bottomRight}
                </div>
            </div>

            <button onClick={resetLayout} style={styles.resetBtn}>Reset layout</button>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    wrap: { position: "relative", height: "100%", borderRadius: 16 },
    top: { minHeight: MIN_TOP_H, background: "transparent" },
    hSeparator: { height: 12, cursor: "row-resize", background: "transparent" },
    bottom: { minHeight: MIN_BOTTOM_H, display: "flex", alignItems: "stretch", gap: 8 },
    bottomLeft: { minWidth: `${MIN_LEFT_W * 100}%` },
    vSeparator: { width: 8, cursor: "col-resize", background: "transparent" },
    bottomRight: { minWidth: `${MIN_RIGHT_W * 100}%` },
    resetBtn: {
        position: "absolute",
        top: 8,
        right: 8,
        padding: "6px 10px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "#fff",
        cursor: "pointer",
        fontWeight: 600,
    },
};
