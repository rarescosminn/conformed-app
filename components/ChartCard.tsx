// components/ChartCard.tsx
"use client";

import * as React from "react";

type Props = {
    /** limite decente ca să nu devină ilizibil */
    minWidth?: number;
    minHeight?: number;
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
};

/** Wrapper de card simplu: NU mai face unmount/remount în timpul dragului. */
const ChartCard = React.forwardRef<HTMLDivElement, Props>(function ChartCard(
    { minWidth = 520, minHeight = 280, className, style, children },
    ref
) {
    return (
        <div
            ref={ref}
            className={className}
            style={{
                position: "relative",
                minWidth,
                minHeight,
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 14,
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                overflow: "hidden",
                ...style,
            }}
        >
            {/* IMPORTANT: nu demontăm children niciodată */}
            <div style={{ position: "absolute", inset: 0, padding: 8 }}>{children}</div>
        </div>
    );
});

export default ChartCard;

/* ---------------------- HOOK: auto-resize pentru ECharts ---------------------- */

/** rAF-throttle mic */
const rAF = (fn: () => void) => {
    let id = 0;
    return () => {
        cancelAnimationFrame(id);
        id = requestAnimationFrame(fn);
    };
};

/**
 * Observă mărimea cardului (și opțional a "canvasRef") și apelează DOAR `resize()`.
 * NU face `dispose()` / re-init — asta e sursa artefactelor la micșorare.
 *
 * Usage:
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const canvasRef    = useRef<HTMLDivElement>(null);
 *   const chartRef     = useRef<echarts.EChartsType|null>(null);
 *   useEchartsAutoResize(chartRef, containerRef, canvasRef);
 */
export function useEchartsAutoResize(
    chartRef: React.MutableRefObject<any | null>,
    containerRef: React.RefObject<HTMLElement>,
    canvasRef?: React.RefObject<HTMLElement>
) {
    React.useEffect(() => {
        const observed = (canvasRef?.current || containerRef.current) as HTMLElement | null;
        if (!observed) return;

        const doResize = rAF(() => {
            const inst = chartRef.current;
            if (!inst || typeof inst.resize !== "function") return;

            // dacă containerul e momentan ascuns (width/height ~0), amânăm un frame
            const rect = observed.getBoundingClientRect();
            if (rect.width < 2 || rect.height < 2) {
                requestAnimationFrame(() => inst.resize({ animation: { duration: 0 } }));
                return;
            }
            inst.resize({ animation: { duration: 0 } });
        });

        // prima sincronizare după mount
        const id = requestAnimationFrame(doResize);

        const ro = new ResizeObserver(doResize);
        ro.observe(observed);
        if (canvasRef && containerRef.current && canvasRef.current !== containerRef.current) {
            ro.observe(containerRef.current);
        }

        window.addEventListener("resize", doResize);

        return () => {
            cancelAnimationFrame(id);
            ro.disconnect();
            window.removeEventListener("resize", doResize);
        };
    }, [chartRef, containerRef, canvasRef]);
}
