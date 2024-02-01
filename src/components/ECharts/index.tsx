import { HeatmapChart } from "@czi-sds/data-viz";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import React, {
    ForwardedRef,
    RefObject,
    forwardRef,
    memo,
    useEffect,
    useRef,
} from "react";
import GeneListGenerator from "../../helpers/geneListGenerator";
import {
    Y_ITEM_COUNT,
    X_ITEM_COUNT,
    HEATMAP_ITEM_SIZE,
} from "../utils";
import { interpolateMagma, interpolatePlasma, interpolateRainbow, interpolateSpectral, interpolateViridis, interpolateYlOrRd } from "d3-scale-chromatic";
import { useAppContext } from "../../store/useAppContext";
import { EChartsOption, ScatterSeriesOption, getInstanceByDom } from "echarts";

type InterpolatorNames =
    | "Magma"
    | "Rainbow"
    | "Virdis"
    | "Plasma"
    | "Spectral"
    | "YlOrRd";

type Interpolator = Record<InterpolatorNames, (t: number) => string>;

const INTERPOLATORS: Interpolator = {
    Magma: interpolateMagma,
    Rainbow: interpolateRainbow,
    Virdis: interpolateViridis,
    Plasma: interpolatePlasma,
    Spectral: interpolateSpectral,
    YlOrRd: interpolateYlOrRd,
};
interface EChartsProps {
    xAxisLabelRef: RefObject<number>;
    yAxisLabelRef: RefObject<number>;
    onAxisChange?: (
        start: number,
        end: number,
        dir: "horizontal" | "vertical",
    ) => void;
    onItemClicked?: (item?: {x: number, y: number; value: number}) => void;
}

type ChartDataOption = { x: number; y: number; value: number };

const ECharts = forwardRef(
    (props: EChartsProps, ref: ForwardedRef<HTMLDivElement>) => {
        const { onAxisChange, onItemClicked, xAxisLabelRef, yAxisLabelRef } = props;
        const { chartInstance, setChartInstance } = useAppContext();
        const clickedItem = useRef<number>(-1);
        const data = useSelector((state: RootState) => state.dataReducer.data);
        const size = useSelector((state: RootState) => state.dataReducer.size);
        const heatmapCanvasSize = useSelector(
            (state: RootState) => state.dataReducer.heatmapCanvasSize
        );
        const color = useSelector((state: RootState) => state.dataReducer.color);
        const emphasis = useSelector(
            (state: RootState) => state.dataReducer.emphasis
        );
        const symbol = useSelector((state: RootState) => state.dataReducer.symbol);
        const renderer = useSelector((state: RootState) => state.dataReducer.renderer);
        const camera = useSelector((state: RootState) => state.dataReducer.camera);

        const innerChartRef = useRef<HTMLDivElement | null>(null);

        useEffect(() => {
            //Reset xAxis on each chart re-renders
            onAxisChange?.(0, 100, "horizontal");

            //Reset yAxis on each chart re-renders
            onAxisChange?.(0, 100, "vertical");

            onItemClicked?.({x: -1, y: -1, value: -1});


            if (innerChartRef.current) {
                const chart = getInstanceByDom(innerChartRef.current);
                chart?.dispatchAction({
                    type: "downplay",
                    seriesIndex: 0,
                });
            }
        }, [data, size, color, emphasis, symbol, camera]);

        const xAxisLabelNames = GeneListGenerator(size).map((d) => d.name);
        const yAxisLabelNames = GeneListGenerator(size).map((d) => d.name);

        const options = {
            animation: !camera,
            grid: {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            },
            series: [
                {
                    name: "SDS Heatmap",
                    clip: true,
                    symbol: symbol.charAt(0).toLowerCase() + symbol.slice(1),
                    emphasis: {
                        scale: false,
                        itemStyle: {
                            borderWidth: symbol === "circle" ? 2 : 4,
                            borderColor: symbol === "circle" ? "#000" : "#fff",
                            borderType: "solid",
                        },
                    } as ScatterSeriesOption["emphasis"],
                },
            ],
            tooltip: camera ? {
                enterable: true,
                formatter: function (param: any) {
                    return param.data ? [
                        `X-Axis: <strong>${xAxisLabelNames[param.data.x]}</strong><br/>`,
                        `Y-Axis: <strong>${yAxisLabelNames[param.data.y]
                        }</strong><br/><br/>`,
                        `${param.marker} <strong>${param.data.value.toFixed(6)}</strong>`,
                    ].join("") : [];
                },
            } : {show: false},
            xAxis: {
                axisPointer: {show: false},
                show: false,
                type: "category",
                data: xAxisLabelNames,
                position: "top",
                axisLabel: {
                    rotate: 90
                }
            } as EChartsOption["xAxis"],
            yAxis: {
                axisPointer: {show: false},
                show: true,
                type: "category",
                data: yAxisLabelNames,
                inverse: true
            } as EChartsOption["yAxis"],
        };

        const shiftHeld = useRef<boolean>(false);

        function downHandler({ key }: KeyboardEvent) {
            if (key === "Shift") {
                shiftHeld.current = true;
                if (innerChartRef.current) {
                    getInstanceByDom(innerChartRef.current)?.setOption({
                        dataZoom: [
                            {
                                moveOnMouseWheel: true,
                            },
                            {
                                moveOnMouseWheel: false,
                            },
                        ],
                    });
                }
            }
        }

        function upHandler({ key }: KeyboardEvent) {
            if (key === "Shift") {
                shiftHeld.current = false;
                if (innerChartRef.current) {
                    getInstanceByDom(innerChartRef.current)?.setOption({
                        dataZoom: [
                            {
                                moveOnMouseWheel: false,
                            },
                            {
                                moveOnMouseWheel: true,
                            },
                        ],
                    });
                }
            }
        }

        useEffect(() => {
            window.addEventListener("keydown", downHandler);
            window.addEventListener("keyup", upHandler);
            return () => {
                window.removeEventListener("keydown", downHandler);
                window.removeEventListener("keyup", upHandler);
            };
        }, []);

        return (
            <>
                <HeatmapChart
                    ref={handleRef}
                    axisPointer={{
                        show: false,
                    }}
                    width={camera ? heatmapCanvasSize.width : (HEATMAP_ITEM_SIZE) * size}
                    height={camera ? heatmapCanvasSize.height : (HEATMAP_ITEM_SIZE) * size}
                    xAxisData={[...Array(size).keys()]}
                    yAxisData={[...Array(size).keys()]}
                    echartsRendererMode={renderer}
                    camera={{
                        active: camera,
                        height: Y_ITEM_COUNT,
                        width: X_ITEM_COUNT,
                    }}
                    data={data}
                    encode={{ x: 'x', y: 'y' }}
                    symbolSize={function (props: { value: number; }) {
                        switch (symbol) {
                            case "circle":
                                return props.value * HEATMAP_ITEM_SIZE;
                            case "rect":
                            default: {
                                return HEATMAP_ITEM_SIZE;
                            }
                        }
                    }}
                    itemStyle={{
                        color: (props) => {
                            let data = props.data as ChartDataOption;

                            return (INTERPOLATORS as Interpolator)[
                                color as InterpolatorNames
                            ](data.value);
                        },
                        opacity: 1,
                        borderWidth: 1,
                        borderColor: "#fff",
                        borderType: "solid",
                    }}
                    options={options}
                    onEvents={{
                        dataZoom: handleDataZoom,
                        click: handleClick,
                    }}
                />
            </>
        );

        function handleRef(element: HTMLDivElement | null) {
            innerChartRef.current = element;

            if(element) {
                const chart = getInstanceByDom(element);
                setChartInstance?.(chart);
            }
        
            if (!ref) return;
        
            if (typeof ref === "function") {
                ref(element);
            } else {
                ref.current = element;
            }
        }
        
        function handleDataZoom (evt: any) {
            if (evt.batch.length > 1) {
                const { start: xStart, end: xEnd } = evt.batch[0];
                const { start: yStart, end: yEnd } = evt.batch[1];
                onAxisChange?.(yStart, yEnd, "vertical");
                onAxisChange?.(xStart, xEnd, "horizontal");
            } else if (shiftHeld.current) {
                const { start, end } = evt.batch[0];
                onAxisChange?.(start, end, "horizontal");
            } else {
                const { start, end } = evt.batch[0];
                onAxisChange?.(start, end, "vertical");
            }

            if (innerChartRef.current) {
                const echartInstance = getInstanceByDom(innerChartRef.current);

                //Downplay all items on camera scroll
                echartInstance &&
                    echartInstance.dispatchAction({
                        type: "downplay",
                        seriesIndex: 0,
                    });

                // Preserve Highlighted row + column based on emphasis type during scroll
                if (
                    xAxisLabelRef?.current !== null &&
                    xAxisLabelRef?.current > -1 &&
                    yAxisLabelRef?.current !== null &&
                    yAxisLabelRef?.current > -1
                ) {
                    echartInstance &&
                        echartInstance.dispatchAction({
                            type: "downplay",
                            seriesIndex: [0],
                        });

                    const data = echartInstance
                        ? (echartInstance.getOption().series as any)[0].data
                        : [];

                    let dataIndex = [];
                    
                    switch (emphasis) {
                        case "item":
                            dataIndex.push(
                                xAxisLabelRef?.current * size + yAxisLabelRef?.current
                            );
                            break;

                        case "row":
                            for (let i = 0; i < size; i++) {
                                dataIndex.push(i * size + yAxisLabelRef?.current);
                            }

                            break;

                        case "column":
                            for (let i = 0; i < size; i++) {
                                dataIndex.push(xAxisLabelRef?.current * size + i);
                            }

                            break;

                        case "cross":
                        default:
                            for (let i = 0; i < size; i++) {
                                dataIndex.push(
                                    i * size + yAxisLabelRef?.current,
                                    xAxisLabelRef?.current * size + i
                                );
                            }
                    }

                    echartInstance &&
                        echartInstance.dispatchAction({
                            type: "highlight",
                            seriesIndex: 0,
                            dataIndex,
                        });
                }
                // Preserve Highlighted row during scroll
                else if (yAxisLabelRef?.current !== null && yAxisLabelRef?.current > -1) {
                    echartInstance &&
                        echartInstance.dispatchAction({
                            type: "downplay",
                            seriesIndex: [0],
                        });

                    const data = echartInstance
                        ? (echartInstance.getOption().series as any)[0].data
                        : [];
                    let dataIndex = [];

                    for (let i = 0; i < size; i++) {
                        dataIndex.push(i * size + yAxisLabelRef?.current);
                    }

                    echartInstance &&
                        echartInstance.dispatchAction({
                            type: "highlight",
                            seriesIndex: 0,
                            dataIndex,
                        });
                }
                // Preserve Highlighted column during scroll
                else if (xAxisLabelRef?.current !== null && xAxisLabelRef?.current > -1) {
                    echartInstance &&
                        echartInstance.dispatchAction({
                            type: "downplay",
                            seriesIndex: [0],
                        });

                    const data = echartInstance
                        ? (echartInstance.getOption().series as any)[0].data
                        : [];

                    let dataIndex = [];

                    for (let i = 0; i < size; i++) {
                        dataIndex.push(xAxisLabelRef?.current * size + i);
                    }

                    echartInstance &&
                        echartInstance.dispatchAction({
                            type: "highlight",
                            seriesIndex: 0,
                            dataIndex,
                        });
                }
            }
        }

        function handleClick (params: any) {
            if (innerChartRef.current) {
                const echartInstance = getInstanceByDom(innerChartRef.current);
                
                if (params.event.target) {
                    // Downplay all items when clicked on the same item again
                    if (params.dataIndex === clickedItem.current) {
                        echartInstance?.dispatchAction({
                            type: "downplay",
                            seriesIndex: 0,
                        });
                        clickedItem.current = -1;

                        onItemClicked?.({x: -1, y: -1, value: -1});
                    } else {
                        clickedItem.current = params.dataIndex;
                        onItemClicked?.(params.data);

                        echartInstance?.dispatchAction({
                            type: "downplay",
                            seriesIndex: 0,
                        });

                        //Highlight based on the Emphasis type
                        const seriesIndex = params.seriesIndex;
                        const {x, y} = params.data;
                        let dataIndex = [];

                        switch (emphasis) {
                            case "item":
                                dataIndex = params.dataIndex;
                                break;

                            case "row":
                                for (let i = 0; i < size; i++) {
                                    dataIndex.push(i * size + y);
                                }
                                break;

                            case "column":
                                for (let i = 0; i < size; i++) {
                                    dataIndex.push(x * size + i);
                                }
                                break;

                            case "cross":
                            default:
                                for (let i = 0; i < size; i++) {
                                    dataIndex.push(i * size + y, x * size + i);
                                }
                                break;
                        }

                        echartInstance?.dispatchAction({
                            type: "highlight",
                            seriesIndex,
                            dataIndex
                        });
                    }
                }
            }
        }
    }
);

export default ECharts;