import { createContext, useState } from "react";
import { EChartsInstance } from "echarts-for-react";

export interface ChartContextValue {
    chartInstance: EChartsInstance | null;
    setChartInstance: React.Dispatch<React.SetStateAction<EChartsInstance | null>>;
}

export const AppContext = createContext<ChartContextValue | undefined>(undefined);
