// components/AutoEChart.tsx
"use client";

import * as React from "react";
import * as echarts from "echarts";

export type AutoEChartProps = {
    title?: string;
    option: echarts.EChartsOption;
    minHeight?: number;
    className?: string;
    style?: React.CSSProperties;
};

const rAF = (fn: () => void) => {
    let id = 0;
    return () => {
        cancelAnimationFrame(id);
        id = requestAnimationFrame(fn);
    };
};

export default function AutoEChart({
    title,
    option,
    minHeight = 280,
    className,
    style,
}: AutoEChartProps) {
    const hostRef = React.useRef<HTMLDivElement | null>(null);
    const canvasRef = React.useRef<HTMLDivElement | null>(null);
    const chartRef = React.useRef<echarts.EChartsType | null>(null);

    // opțiune sigură: SVG + fără animații
    const safeOption = React.useMemo<echarts.EChartsOption>(() => {
        const base: echarts.EChartsOption = {
            animation: false,
            animationDuration: 0,
            animationDurationUpdate: 0,
            ...option,
        };
        if (title) {
            base.title = {
                text: title,
                left: 10,
                top: 6,
                textStyle: { fontSize: 16, fontWeight: 700 },
                ...(option.title as any),
            };
        }
        return base;
    }, [option, title]);

    // init + setOption
    React.useEffect(() => {
        const el = canvasRef.current;
        if (!el) return;

        // init SVG
        const inst = echarts.init(el, undefined, { renderer: "svg", useDirtyRect: false });
        chartRef.current = inst;
        inst.setOption(safeOption, true, false);

        return () => {
            try { inst.dispose(); } catch { }
            chartRef.current = null;
        };
    }, [safeOption]);

    // Resize după mărimea cardului (hostRef)
    React.useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        const doResize = rAF(() => {
            const inst = chartRef.current;
            if (!inst) return;
            inst.resize({ animation: { duration: 0 } });
        });

        const ro = new ResizeObserver(doResize);
        ro.observe(host);

        // resize și la schimbarea ferestrei
        window.addEventListener("resize", doResize);

        // o iterație după primul paint (în caz că are tranziții)
        const id = requestAnimationFrame(doResize);

        return () => {
            cancelAnimationFrame(id);
            ro.disconnect();
            window.removeEventListener("resize", doResize);
        };
    }, []);

    return (
        <div
            ref={hostRef}
            className={className}
            style={{
                position: "relative",
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 14,
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                minHeight,
                ...style,
            }}
        >
            <div
                ref={canvasRef}
                className="echarts"
                style={{ position: "absolute", inset: 0, padding: 8 }}
            />
        </div>
    );
}
