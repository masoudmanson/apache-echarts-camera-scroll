import ReactECharts from "echarts-for-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import React, {
    RefObject,
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
    onItemClicked?: (item: number[]) => void;
}

const ECharts = React.memo(
    (props: EChartsProps) => {
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

        useEffect(() => {
            //Reset xAxis on each chart re-renders
            onAxisChange?.(0, 100, "horizontal");

            //Reset yAxis on each chart re-renders
            onAxisChange?.(0, 100, "vertical");

            onItemClicked?.([]);
        }, [data, size, color, emphasis, symbol]);

        const xAxisLabelNames = GeneListGenerator(size).map((d) => d.name);
        const yAxisLabelNames = GeneListGenerator(size).map((d) => d.name);

        const DATA_ZOOM = camera ? [
            {
                // start index of the x axis window
                startValue: 0,
                // // end index of the x axis window
                endValue: X_ITEM_COUNT - 1,
                maxValueSpan: X_ITEM_COUNT,
                type: "inside",
                zoomOnMouseWheel: false,
                // There's a PR to allow touchpad panning
                // https://github.com/apache/echarts/pull/17288
                moveOnMouseWheel: false,
                moveOnMouseMove: true,
                filterMode: "filter",
                throttle: 0,
                preventDefaultMouseMove: true,
                orient: "horizontal",
            },
            {
                // start index of the y axis window
                startValue: 0,
                // end index of the y axis window
                endValue: Y_ITEM_COUNT - 1,
                type: "inside",
                zoomOnMouseWheel: false,
                moveOnMouseWheel: true,
                moveOnMouseMove: true,
                yAxisIndex: 0,
                filterMode: "filter",
                maxValueSpan: Y_ITEM_COUNT,
                throttle: 0,
                preventDefaultMouseMove: true,
                orient: "vertical",
            },
        ] : [];

        const options = {
            // no animation, since it feels very distracting
            animation: false,
            tooltip: {
                enterable: true,
                formatter: function (param: any) {
                    return [
                        `X-Axis: <strong>${xAxisLabelNames[param.data[0]]}</strong><br/>`,
                        `Y-Axis: <strong>${yAxisLabelNames[param.data[1]]
                        }</strong><br/><br/>`,
                        `${param.marker} <strong>${param.value[2].toFixed(6)}</strong>`,
                    ].join("");
                },
            },
            grid: {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            },
            dataZoom: DATA_ZOOM,
            xAxis: {
                show: false,
                type: "category",
                data: xAxisLabelNames,
                position: "top",
                axisLabel: {
                    rotate: 90
                }
            },
            yAxis: {
                show: true,
                type: "category",
                data: yAxisLabelNames,
                inverse: true
            },
            series: [
                {
                    name: "SDS Heatmap",
                    data: data,
                    type: "scatter",
                    clip: true,
                    itemStyle: {
                        color(props: { data: number[] }) {
                            return (INTERPOLATORS as Interpolator)[
                                color as InterpolatorNames
                            ](props.data[2]);
                        },
                        opacity: 1,
                        borderWidth: 1,
                        borderColor: "#fff",
                        borderType: "solid",
                    },
                    symbol: symbol.charAt(0).toLowerCase() + symbol.slice(1),
                    symbolSize: function (props: number[]) {
                        switch (symbol) {
                            case "circle":
                                return props[2] * HEATMAP_ITEM_SIZE;
                            case "rect":
                            default: {
                                return HEATMAP_ITEM_SIZE;
                            }
                        }
                    },
                    emphasis: {
                        scale: false,
                        itemStyle: {
                            borderWidth: symbol === "circle" ? 2 : 5,
                            borderColor: symbol === "circle" ? "#000" : "#fff",
                            borderType: "solid",
                        },
                    },
                },
            ],
        };

        const shiftHeld = useRef<boolean>(false);

        function downHandler({ key }: KeyboardEvent) {
            if (key === "Shift") {
                shiftHeld.current = true;
                const echartInstance = chartInstance?.getEchartsInstance();
                echartInstance?.setOption({
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

        function upHandler({ key }: KeyboardEvent) {
            if (key === "Shift") {
                shiftHeld.current = false;
                const echartInstance = chartInstance?.getEchartsInstance();
                echartInstance?.setOption({
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

        useEffect(() => {
            window.addEventListener("keydown", downHandler);
            window.addEventListener("keyup", upHandler);
            return () => {
                window.removeEventListener("keydown", downHandler);
                window.removeEventListener("keyup", upHandler);
            };
        }, [chartInstance]);

        return (
            <ReactECharts
                ref={(e) => setChartInstance(e)}
                option={options}
                opts={{
                    renderer: renderer,
                    width: camera ? heatmapCanvasSize.width : (HEATMAP_ITEM_SIZE) * size,
                    height: camera ? heatmapCanvasSize.height : (HEATMAP_ITEM_SIZE) * size,
                }}
                onEvents={{
                    dataZoom: function (evt: any) {
                        const echartInstance = chartInstance?.getEchartsInstance();

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
                    },
                    click: function (params: any) {
                        const echartInstance = chartInstance?.getEchartsInstance();

                        if (params.event.target) {
                            // Downplay all items when clicked on the same item again
                            if (params.dataIndex === clickedItem.current) {
                                echartInstance?.dispatchAction({
                                    type: "downplay",
                                    seriesIndex: 0,
                                });
                                clickedItem.current = -1;

                                onItemClicked?.([]);
                            } else {
                                clickedItem.current = params.dataIndex;
                                onItemClicked?.(params.data);

                                echartInstance?.dispatchAction({
                                    type: "downplay",
                                    seriesIndex: 0,
                                });

                                //Highlight based on the Emphasis type
                                const seriesIndex = params.seriesIndex;
                                const [x, y] = params.data;
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
                    },
                }}
            />
        );
    }
);

export default ECharts;