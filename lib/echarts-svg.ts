// lib/echarts-svg.ts
import * as echarts from "echarts";

// Tipul opțiunilor de init, inferat din semnătura funcției (compatibil cu toate versiunile)
type InitOpts = Parameters<typeof echarts.init>[2];

// păstrăm referința la init-ul original
const _init = echarts.init;

// suprascriem init ca să injectăm mereu renderer: "svg"
(echarts as any).init = function (
    dom: HTMLDivElement,
    theme?: string | object,
    opts?: InitOpts
) {
    const merged: InitOpts = {
        useDirtyRect: false,
        ...(opts as any),
        renderer: "svg", // 👈 forțăm global SVG
    };
    return _init.call(this, dom, theme, merged);
};

export default echarts;
