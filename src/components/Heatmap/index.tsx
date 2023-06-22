import {
  interpolateMagma,
  interpolateViridis,
  interpolateYlOrRd,
  interpolateRainbow,
  interpolatePlasma,
  interpolateSpectral,
} from "d3-scale-chromatic";
import ReactECharts from "echarts-for-react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { StyledContainer, StyledHeatmapWrapper } from "./style";
import React, {
  MutableRefObject,
  Ref,
  RefCallback,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import GeneListGenerator from "../../helpers/geneListGenerator";
import { XAxisWrapper } from "../XAxisChart/style";
import XAxisChart, { XAxisRefType } from "../XAxisChart";
import {
  Y_ITEM_COUNT,
  X_ITEM_COUNT,
  X_AXIS_WIDTH,
  Y_AXIS_WIDTH,
  HEATMAP_ITEM_SIZE,
} from "../utils";
import EChartsReact from "echarts-for-react";
import YAxisChart, { YAxisRefType } from "../YAxisChart";
import { YAxisWrapper } from "../YAxisChart/style";

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

type MutableRefList<T> = Array<
  RefCallback<T> | MutableRefObject<T> | undefined | null
>;

export function mergeRefs<T>(...refs: MutableRefList<T>): RefCallback<T> {
  return (val: T) => {
    setRef(val, ...refs);
  };
}

export function setRef<T>(val: T, ...refs: MutableRefList<T>): void {
  refs.forEach((ref) => {
    if (typeof ref === "function") {
      ref(val);
    } else if (ref != null) {
      ref.current = val;
    }
  });
}

interface EChartsProps {
  xAxisLabelRef: RefObject<number>;
  yAxisLabelRef: RefObject<number>;
  onAxisChange?: (
    start: number,
    end: number,
    dir: "horizontal" | "vertical"
  ) => void;
  onItemClicked?: (item: number[]) => void;
}

const ECharts = React.memo(
  React.forwardRef((props: EChartsProps, ref: Ref<EChartsReact>) => {
    const { onAxisChange, onItemClicked, xAxisLabelRef, yAxisLabelRef } = props;

    const clickedItem = useRef<number>(-1);
    const myRef = useRef<EChartsReact | null>(null);

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

    const values = [...Array(size).keys()];

    useEffect(() => {
      //Reset xAxis on each chart re-renders
      onAxisChange?.(0, 100, "horizontal");

      //Reset yAxis on each chart re-renders
      onAxisChange?.(0, 100, "vertical");
    }, [data, size, color, emphasis, symbol]);

    const xAxisLabelNames = GeneListGenerator(size).map((d) => d.name);
    const yAxisLabelNames = GeneListGenerator(size).map((d) => d.name);

    const options = {
      // no animation, since it feels very distracting
      animation: false,
      tooltip: {
        formatter: function (param: any) {
          return [
            `X-Axis: <strong>${xAxisLabelNames[param.data[0]]}</strong><br/>`,
            `Y-Axis: <strong>${
              yAxisLabelNames[param.data[1]]
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
      dataZoom: [
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
          moveOnMouseMove: false,
          filterMode: "filter",
          throttle: 0,
          preventDefaultMouseMove: true,
          orient: "horizontal",
        },
        {
          // start index of the y axis window
          startValue: Y_ITEM_COUNT - 1,
          // end index of the y axis window
          endValue: 0,
          type: "inside",
          zoomOnMouseWheel: false,
          moveOnMouseWheel: true,
          moveOnMouseMove: false,
          yAxisIndex: 0,
          filterMode: "filter",
          maxValueSpan: Y_ITEM_COUNT,
          throttle: 0,
          preventDefaultMouseMove: true,
          orient: "vertical",
        },
      ],
      xAxis: {
        show: false,
        type: "category",
        data: xAxisLabelNames,
      },
      yAxis: {
        show: false,
        type: "category",
        data: yAxisLabelNames,
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
            borderWidth: 0,
          },
          symbol: symbol.charAt(0).toLowerCase() + symbol.slice(1),
          symbolSize: function (props: number[]) {
            switch (symbol) {
              case "Circle":
                return props[2] * HEATMAP_ITEM_SIZE;
              case "Rect":
              default: {
                return HEATMAP_ITEM_SIZE;
              }
            }
          },
          emphasis: {
            scale: false,
            itemStyle: {
              opacity: 0.15,
            },
          },
        },
      ],
    };

    const shiftHeld = useRef<boolean>(false);

    function downHandler({ key }: KeyboardEvent) {
      if (key === "Shift") {
        shiftHeld.current = true;
        const echartInstance = myRef?.current?.getEchartsInstance();
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
        const echartInstance = myRef?.current?.getEchartsInstance();
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
    }, []);

    return (
      <ReactECharts
        ref={mergeRefs(ref, (callbackRef) => {
          myRef.current = callbackRef;
        })}
        option={options}
        opts={{
          renderer: "svg",
          width: heatmapCanvasSize.width,
          height: heatmapCanvasSize.height,
        }}
        onEvents={{
          dataZoom: function (evt: any) {
            const echartInstance = myRef?.current?.getEchartsInstance();

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
              xAxisLabelRef?.current &&
              xAxisLabelRef?.current > -1 &&
              yAxisLabelRef?.current &&
              yAxisLabelRef?.current > -1
            ) {
              echartInstance &&
                echartInstance.dispatchAction({
                  type: "highlight",
                  seriesIndex: [0],
                });

              const data = echartInstance
                ? (echartInstance.getOption().series as any)[0].data
                : [];

              let dataIndex = [];

              switch (emphasis) {
                case "Item":
                  dataIndex.push(
                    xAxisLabelRef?.current * size + yAxisLabelRef?.current
                  );
                  break;

                case "Row":
                  for (let i = 0; i < size; i++) {
                    dataIndex.push(i * size + yAxisLabelRef?.current);
                  }

                  break;

                case "Column":
                  for (let i = 0; i < size; i++) {
                    dataIndex.push(xAxisLabelRef?.current * size + i);
                  }

                  break;

                case "Cross":
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
                  type: "downplay",
                  seriesIndex: 0,
                  dataIndex,
                });
            }
            // Preserve Highlighted row during scroll
            else if (yAxisLabelRef?.current && yAxisLabelRef?.current > -1) {
              echartInstance &&
                echartInstance.dispatchAction({
                  type: "highlight",
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
                  type: "downplay",
                  seriesIndex: 0,
                  dataIndex,
                });
            }
            // Preserve Highlighted column during scroll
            else if (xAxisLabelRef?.current && xAxisLabelRef?.current > -1) {
              echartInstance &&
                echartInstance.dispatchAction({
                  type: "highlight",
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
                  type: "downplay",
                  seriesIndex: 0,
                  dataIndex,
                });
            }
          },
          click: function (params: any) {
            const echartInstance = myRef?.current?.getEchartsInstance() as any;

            if (params.event.target) {
              // Downplay all items when clicked on the same item again
              if (params.dataIndex === clickedItem.current) {
                echartInstance &&
                  echartInstance.dispatchAction({
                    type: "downplay",
                    seriesIndex: 0,
                  });
                clickedItem.current = -1;

                onItemClicked?.([]);
              } else {
                clickedItem.current = params.dataIndex;
                onItemClicked?.(params.data);

                //Highligh the whole heatmap first
                echartInstance &&
                  echartInstance.dispatchAction({
                    type: "highlight",
                    seriesIndex: params.seriesIndex,
                  });

                //Downplay based on the Emphasis type
                const seriesIndex = params.seriesIndex,
                  data = echartInstance.getOption().series[seriesIndex].data;
                const [x, y] = params.data;
                let dataIndex = [];

                switch (emphasis) {
                  case "Item":
                    dataIndex = params.dataIndex;
                    break;

                  case "Row":
                    for (let i = 0; i < size; i++) {
                      dataIndex.push(i * size + y);
                    }
                    break;

                  case "Column":
                    for (let i = 0; i < size; i++) {
                      dataIndex.push(x * size + i);
                    }
                    break;

                  case "Cross":
                  default:
                    for (let i = 0; i < size; i++) {
                      dataIndex.push(i * size + y, x * size + i);
                    }
                    break;
                }

                echartInstance.dispatchAction({
                  type: "downplay",
                  seriesIndex,
                  dataIndex,
                });
              }
            }
          },
        }}
      />
    );
  })
);

const Heatmap: React.FC = (props) => {
  const clickedLabelX = useRef<number>(-1);
  const clickedLabelY = useRef<number>(-1);
  const chartRef = useRef<EChartsReact | null>(null);
  const XAxisChartRef = useRef<XAxisRefType>(null);
  const YAxisChartRef = useRef<YAxisRefType>(null);
  const geneNames = useSelector(
    (state: RootState) => state.dataReducer.geneNames
  );
  const size = useSelector((state: RootState) => state.dataReducer.size);
  const heatmapCanvasSize = useSelector(
    (state: RootState) => state.dataReducer.heatmapCanvasSize
  );

  return (
    <StyledContainer>
      <h3>Heatmap</h3>

      <YAxisWrapper
        id="y-axis-wrapper"
        height={heatmapCanvasSize.height}
        width={Y_AXIS_WIDTH}
        bottom={0}
      >
        <YAxisChart
          ref={YAxisChartRef}
          geneNames={geneNames}
          labelClicked={(label) => {
            clickedLabelX.current = -1;

            if (XAxisChartRef.current) {
              XAxisChartRef.current.changeActiveLabel(-1);
            }

            if (chartRef && chartRef.current) {
              const echartInstance =
                chartRef.current.getEchartsInstance() as any;
              if (label.index === clickedLabelY.current) {
                echartInstance.dispatchAction({
                  type: "downplay",
                  seriesIndex: 0,
                });
                clickedLabelY.current = -1;
              } else {
                clickedLabelY.current = label.index;

                echartInstance.dispatchAction({
                  type: "highlight",
                  seriesIndex: [0],
                });

                const series = echartInstance.getOption().series;
                const data = series[0].data;
                const { start, end } = echartInstance.getOption().dataZoom[0];

                const itemSize = heatmapCanvasSize.height / X_ITEM_COUNT;
                const heatmapFullHeight = itemSize * size;
                const quantizedCount = (itemSize * 100) / heatmapFullHeight;
                const xMin = start / quantizedCount;
                const xMax = end / quantizedCount;

                const dataIndex = data
                  .map(([xData, yData, value]: any, idx: any) =>
                    label.index === yData &&
                    xData > xMin - 1 &&
                    xData < xMax + 1 &&
                    Number.isFinite(value)
                      ? idx
                      : null
                  )
                  .filter((v: null) => v !== null);

                echartInstance.dispatchAction({
                  type: "downplay",
                  seriesIndex: 0,
                  dataIndex,
                });
              }
            }
          }}
        />
      </YAxisWrapper>

      <StyledHeatmapWrapper>
        <ECharts
          xAxisLabelRef={clickedLabelX}
          yAxisLabelRef={clickedLabelY}
          ref={(ref) => (chartRef.current = ref)}
          onItemClicked={(item) => {
            if (XAxisChartRef.current) {
              XAxisChartRef.current.changeActiveLabel(item[0]);
            }
            if (YAxisChartRef.current) {
              YAxisChartRef.current.changeActiveLabel(item[1]);
            }
            clickedLabelX.current = item[0];
            clickedLabelY.current = item[1];
          }}
          onAxisChange={(start, end, dir) => {
            // Scroll horizontaly
            if (dir === "horizontal") {
              const itemSize = heatmapCanvasSize.width / X_ITEM_COUNT;

              const heatmapFullWidth = itemSize * size;
              const maxToLeft = (size - X_ITEM_COUNT) * itemSize;
              const quantizedMove = Math.round(
                start / ((itemSize * 100) / heatmapFullWidth)
              );

              let moveToLeft = quantizedMove * itemSize;

              moveToLeft =
                (moveToLeft < maxToLeft ? moveToLeft : maxToLeft) * -1;
              if (
                XAxisChartRef &&
                XAxisChartRef.current &&
                XAxisChartRef.current.getWrapperRef() &&
                XAxisChartRef.current.getWrapperRef().current
              ) {
                (
                  XAxisChartRef.current.getWrapperRef()
                    .current as HTMLDivElement
                ).style.left = `${moveToLeft}px`;
              }
            } else {
              // Scroll Vertically
              const itemSize = heatmapCanvasSize.height / Y_ITEM_COUNT;
              const heatmapFullHeight = itemSize * size;
              const maxToBottom = (size - Y_ITEM_COUNT) * itemSize;
              const quantizedMove = Math.round(
                start / ((itemSize * 100) / heatmapFullHeight)
              );
              let moveToBottom = quantizedMove * itemSize;
              moveToBottom =
                (moveToBottom < maxToBottom ? moveToBottom : maxToBottom) * -1;
              if (
                YAxisChartRef &&
                YAxisChartRef.current &&
                YAxisChartRef.current.getWrapperRef() &&
                YAxisChartRef.current.getWrapperRef().current
              ) {
                (
                  YAxisChartRef.current.getWrapperRef()
                    .current as HTMLDivElement
                ).style.bottom = `${moveToBottom}px`;
              }
            }
          }}
        />
      </StyledHeatmapWrapper>

      <XAxisWrapper
        id="x-axis-wrapper"
        height={X_AXIS_WIDTH}
        width={heatmapCanvasSize.width}
        left={Y_AXIS_WIDTH}
      >
        <XAxisChart
          ref={XAxisChartRef}
          geneNames={geneNames}
          labelClicked={(label) => {
            clickedLabelY.current = -1;

            if (YAxisChartRef.current) {
              YAxisChartRef.current.changeActiveLabel(-1);
            }

            if (chartRef && chartRef.current) {
              const echartInstance =
                chartRef.current.getEchartsInstance() as any;
              if (label.index === clickedLabelX.current) {
                echartInstance.dispatchAction({
                  type: "downplay",
                  seriesIndex: 0,
                });
                clickedLabelX.current = -1;
              } else {
                clickedLabelX.current = label.index;

                echartInstance.dispatchAction({
                  type: "highlight",
                  seriesIndex: [0],
                });

                const series = echartInstance.getOption().series;
                const data = series[0].data;
                const { start, end } = echartInstance.getOption().dataZoom[1];

                const itemSize = heatmapCanvasSize.height / Y_ITEM_COUNT;
                const heatmapFullHeight = itemSize * size;
                const quantizedCount = (itemSize * 100) / heatmapFullHeight;
                const yMin = start / quantizedCount;
                const yMax = end / quantizedCount;

                const dataIndex = data
                  .map(([xData, yData, value]: any, idx: any) =>
                    label.index === xData &&
                    yData > yMin - 1 &&
                    yData < yMax + 1 &&
                    Number.isFinite(value)
                      ? idx
                      : null
                  )
                  .filter((v: null) => v !== null);

                echartInstance.dispatchAction({
                  type: "downplay",
                  seriesIndex: 0,
                  dataIndex,
                });
              }
            }
          }}
        />
      </XAxisWrapper>
    </StyledContainer>
  );
};

export default Heatmap;
