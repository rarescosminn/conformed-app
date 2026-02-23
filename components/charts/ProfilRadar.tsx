"use client";

import { useEffect, useRef } from "react";
import echarts from "@/lib/echarts-svg";
import ChartCard, { useEchartsAutoResize } from "@/components/ChartCard";

const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Noi", "Dec"];
const serie = [700, 705, 710, 715, 720, 725, 730, 735, 740, 850, 855, 860];

export default function ProfilRadar() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<echarts.EChartsType | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const inst = echarts.init(canvasRef.current, undefined, { renderer: "svg", useDirtyRect: false });
        chartRef.current = inst;

        inst.setOption(
            {
                animation: false,
                animationDuration: 0,
                animationDurationUpdate: 0,
                legend: { top: 8, left: "center" },
                tooltip: { confine: true },
                radar: {
                    center: ["52%", "56%"],
                    radius: "70%",
                    splitNumber: 5,
                    axisName: { color: "#666" },
                    indicator: months.map((m) => ({ name: m, max: 900 })),
                },
                series: [
                    { type: "radar", name: "Cost mediu/pacient", areaStyle: { opacity: 0.25 }, data: [serie] },
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

    useEchartsAutoResize(chartRef, containerRef, canvasRef);

    return (
        <ChartCard ref={containerRef} minWidth={520} minHeight={300}>
            <div ref={canvasRef} className="echarts" style={{ width: "100%", height: "100%" }} />
        </ChartCard>
    );
}
