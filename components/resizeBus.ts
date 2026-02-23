// components/resizeBus.ts
export const FORCE_EVENT = "force-echarts-resize";
export const RESIZE_START = "echarts-resize-start";
export const RESIZE_END = "echarts-resize-end";

let rafId = 0;
export function emitForceResize() {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent(FORCE_EVENT));
    });
}

export function emitForceResizeBurst() {
    emitForceResize();
    setTimeout(() => emitForceResize(), 120);
}

export function emitResizeStart() {
    window.dispatchEvent(new CustomEvent(RESIZE_START));
}
export function emitResizeEnd() {
    window.dispatchEvent(new CustomEvent(RESIZE_END));
}
