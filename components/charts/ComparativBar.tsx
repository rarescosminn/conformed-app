"use client";

import { useEffect, useRef } from "react";
import echarts from "@/lib/echarts-svg";
import ChartCard, { useEchartsAutoResize } from "@/components/ChartCard";

const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Noi", "Dec"];
const values = [705, 709, 713, 717, 721, 725, 729, 732, 730, 760, 850, 848];

export default function EvolutieLunara() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<echarts.EChartsType | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Init o singură dată, pe SVG
        const inst = echarts.init(canvasRef.current, undefined, { renderer: "svg", useDirtyRect: false });
        chartRef.current = inst;

        inst.setOption(
            {
                animation: false,
                animationDuration: 0,
                animationDurationUpdate: 0,
                grid: { left: 40, right: 20, top: 48, bottom: 40, containLabel: true },
                legend: { top: 8, left: "center" },
                tooltip: { trigger: "axis", confine: true },
                xAxis: { type: "category", data: months, axisTick: { alignWithLabel: true } },
                yAxis: { type: "value" },
                series: [
                    {
                        type: "line",
                        name: "Cost mediu/pacient",
                        smooth: true,
                        showSymbol: true,
                        symbolSize: 6,
                        lineStyle: { width: 2 },
                        areaStyle: { opacity: 0.25 },
                        data: values,
                    },
                ],
            },
            true,
            false
        );

        return () => {
            try { inst.dispose(); } catch { }
            chartRef.current = null;
        };
    }, []);

    // DOAR resize, fără dispose/reinit
    useEchartsAutoResize(chartRef, containerRef, canvasRef);

    return (
        <ChartCard ref={containerRef} minWidth={900} minHeight={320}>
            <div ref={canvasRef} className="echarts" style={{ width: "100%", height: "100%" }} />
        </ChartCard>
    );
}
