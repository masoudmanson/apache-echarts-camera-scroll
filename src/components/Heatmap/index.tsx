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
import { StyledHeatmapWrapper } from "./style";
import React, {
  LegacyRef,
  MutableRefObject,
  Ref,
  RefCallback,
  useEffect,
  useRef,
} from "react";
import GeneListGenerator from "../../helpers/geneListGenerator";
import { XAxisWrapper } from "../XAxisChart/style";
import XAxisChart from "../XAxisChart";
import { ITEM_COUNT } from "../XAxisChart/utils";
import EChartsReact from "echarts-for-react";
import { EChartsOption, EChartsType } from "echarts";

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
  onXAxisChange?: (start: number, end: number) => void;
}

const ECharts = React.forwardRef(
  (props: EChartsProps, ref: Ref<EChartsReact>) => {
    console.log({ ref });

    const { onXAxisChange } = props;
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

    const values = [...Array(size).keys()];

    useEffect(() => {
      //Reset xAxis on each char tre-renders
      onXAxisChange?.(0, 100);
    }, [data, size, color, emphasis, symbol]);

    const options = {
      // no animation, since it feels very distracting
      animation: false,
      tooltip: {
        valueFormatter: (value: any[]) => value[2].toFixed(4),
      },
      grid: {
        // top: CHART_TOP_PADDING + "px",
        // left: CHART_LEFT_PADDING + "px",
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
          endValue: ITEM_COUNT * 2 - 1,
          maxValueSpan: ITEM_COUNT * 2,
          type: "inside",
          zoomOnMouseWheel: false,
          // There's a PR to allow touchpad panning
          // https://github.com/apache/echarts/pull/17288
          moveOnMouseWheel: true,
          filterMode: "filter",
          throttle: 0,
          preventDefaultMouseMove: true,
          orient: "horizontal",
        },
        {
          // start index of the y axis window
          startValue: ITEM_COUNT - 1,
          // end index of the y axis window
          endValue: 0,
          type: "inside",
          zoomOnMouseWheel: false,
          moveOnMouseWheel: false,
          moveOnMouseMove: false,
          yAxisIndex: 0,
          filterMode: "filter",
          maxValueSpan: ITEM_COUNT,
          throttle: 0,
          preventDefaultMouseMove: true,
          orient: "vertical",
        },
      ],
      xAxis: {
        show: false,
        type: "category",
        data: GeneListGenerator(size).map((d) => d.name),
        triggerEvent: true,
        axisLabel: {
          rotate: 90,
        },
      },
      yAxis: {
        show: false,
        type: "category",
        data: values,
        triggerEvent: false,
      },
      series: [
        {
          name: "SDS Heatmap",
          data: data,
          progressive: 2 * Math.pow(ITEM_COUNT - 1, 2),
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
                return props[2] * 25;
              case "Rect":
              default: {
                return 25;
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

    const myRef = useRef<EChartsReact | null>(null);

    useEffect(() => {
      console.log("ref changes", ref);
    }, [ref]);

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
            // dispatch(setAxisLeft(Math.floor(evt.batch[0].start)));
            onXAxisChange?.(evt.batch[0].start, evt.batch[0].end);

            //Downplay all items on camera scroll
            const echartInstance = myRef?.current?.getEchartsInstance();
            echartInstance &&
              echartInstance.dispatchAction({
                type: "downplay",
                seriesIndex: 0,
              });
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
              } else {
                clickedItem.current = params.dataIndex;

                if (params.targetType === "axisLabel") {
                  echartInstance &&
                    echartInstance.dispatchAction({
                      type: "highlight",
                      seriesIndex: [0],
                    });
                  const data = echartInstance
                    ? echartInstance.getOption().series[0].data
                    : [];
                  const dataIndex = data
                    .map(([xData, yData, value]: any, idx: any) =>
                      params.dataIndex ===
                        (params.componentType === "yAxis" ? yData : xData) &&
                      Number.isFinite(value)
                        ? idx
                        : null
                    )
                    .filter((v: null) => v !== null);

                  echartInstance &&
                    echartInstance.dispatchAction({
                      type: "downplay",
                      seriesIndex: 0,
                      dataIndex,
                    });
                } else {
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
                      dataIndex = data
                        .map(([xData, yData, value]: any, idx: any) =>
                          y === yData && Number.isFinite(value) ? idx : null
                        )
                        .filter((v: null) => v !== null);
                      break;

                    case "Column":
                      dataIndex = data
                        .map(([xData, yData, value]: any, idx: any) =>
                          x === xData && Number.isFinite(value) ? idx : null
                        )
                        .filter((v: null) => v !== null);
                      break;

                    case "Cross":
                    default:
                      dataIndex = data
                        .map(([xData, yData, value]: any, idx: any) =>
                          (y === yData && Number.isFinite(value)) ||
                          (x === xData && Number.isFinite(value))
                            ? idx
                            : null
                        )
                        .filter((v: null) => v !== null);
                      break;
                  }

                  echartInstance.dispatchAction({
                    type: "downplay",
                    seriesIndex,
                    dataIndex,
                  });
                }
              }
            }
          },
        }}
      />
    );
  }
);

const Heatmap: React.FC = (props) => {
  const clickedLabel = useRef<number>(-1);
  const chartRef = useRef<EChartsReact | null>(null);
  const XAxisChartRef = useRef<HTMLDivElement | null>(null);
  const geneNames = useSelector(
    (state: RootState) => state.dataReducer.geneNames
  );
  const size = useSelector((state: RootState) => state.dataReducer.size);
  const heatmapCanvasSize = useSelector(
    (state: RootState) => state.dataReducer.heatmapCanvasSize
  );

  useEffect(() => {
    console.log({ chartRef });
  }, [chartRef]);

  return (
    <StyledHeatmapWrapper>
      <h3>Heatmap</h3>
      <ECharts
        ref={(ref) => (chartRef.current = ref)}
        onXAxisChange={(start, end) => {
          const heatmapFullWidth =
            (heatmapCanvasSize.width / (ITEM_COUNT * 2)) * size;
          const itemSize = heatmapCanvasSize.width / (ITEM_COUNT * 2);
          const maxToLeft = (size - ITEM_COUNT * 2) * itemSize;
          const quantizedMove = Math.round(
            start / ((itemSize * 100) / heatmapFullWidth)
          );
          let moveToLeft = quantizedMove * itemSize;
          moveToLeft = (moveToLeft < maxToLeft ? moveToLeft : maxToLeft) * -1;
          if (XAxisChartRef && XAxisChartRef.current) {
            XAxisChartRef.current.style.left = `${moveToLeft}px`;
          }
        }}
      />
      <XAxisWrapper
        id="x-axis-wrapper"
        height={150}
        width={heatmapCanvasSize.width}
        left={0}
      >
        <XAxisChart
          ref={XAxisChartRef}
          geneNames={geneNames}
          labelClicked={(label) => {
            if (chartRef && chartRef.current) {
              const echartInstance =
                chartRef.current.getEchartsInstance() as any;
              if (label.index === clickedLabel.current) {
                echartInstance.dispatchAction({
                  type: "downplay",
                  seriesIndex: 0,
                });
                clickedLabel.current = -1;
              } else {
                clickedLabel.current = label.index;

                echartInstance.dispatchAction({
                  type: "highlight",
                  seriesIndex: [0],
                });

                const series = echartInstance.getOption().series;
                const data = series[0].data;
                const dataIndex = data
                  .map(([xData, yData, value]: any, idx: any) =>
                    label.index === xData && Number.isFinite(value) ? idx : null
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
          left={0}
        />
      </XAxisWrapper>
    </StyledHeatmapWrapper>
  );
};

export default Heatmap;
