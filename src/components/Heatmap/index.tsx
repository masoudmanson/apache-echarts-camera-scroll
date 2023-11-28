import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { StyledContainer, StyledHeatmapWrapper } from "./style";
import React, {
  useRef,
} from "react";
import { XAxisWrapper } from "../XAxisChart/style";
import XAxisChart, { XAxisRefType } from "../XAxisChart";
import {
  Y_ITEM_COUNT,
  X_ITEM_COUNT,
  X_AXIS_WIDTH,
  Y_AXIS_WIDTH,
  HEATMAP_ITEM_SIZE,
  Y_AXIS_REVERSE,
} from "../utils";
import YAxisChart, { YAxisRefType } from "../YAxisChart";
import { YAxisWrapper } from "../YAxisChart/style";
import ECharts from "../ECharts";
import { useAppContext } from "../../store/useAppContext";

const Heatmap: React.FC = (props) => {
  const { chartInstance } = useAppContext();

  const clickedLabelX = useRef<number>(-1);
  const clickedLabelY = useRef<number>(-1);
  const XAxisChartRef = useRef<XAxisRefType>(null);
  const YAxisChartRef = useRef<YAxisRefType>(null);
  const geneNames = useSelector(
    (state: RootState) => state.dataReducer.geneNames
  );
  const size = useSelector((state: RootState) => state.dataReducer.size);
  const emphasis = useSelector(
    (state: RootState) => state.dataReducer.emphasis
  );
  const heatmapCanvasSize = useSelector(
    (state: RootState) => state.dataReducer.heatmapCanvasSize
  );
  const camera = useSelector((state: RootState) => state.dataReducer.camera);

  return (
    <StyledContainer camera={camera}>
      <YAxisWrapper
        id="y-axis-wrapper"
        height={camera ? heatmapCanvasSize.height : HEATMAP_ITEM_SIZE * size}
        width={Y_AXIS_WIDTH}
        bottom={0}
      >
        <YAxisChart
          reverse
          ref={YAxisChartRef}
          geneNames={geneNames}
          labelClicked={(label) => {
            clickedLabelX.current = -1;

            if (XAxisChartRef.current) {
              XAxisChartRef.current.changeActiveLabel(-1);
            }

            const echartInstance = chartInstance?.getEchartsInstance();
            if (label.index === clickedLabelY.current) {
              echartInstance.dispatchAction({
                type: "downplay",
                seriesIndex: 0,
              });
              clickedLabelY.current = -1;
            } else {
              clickedLabelY.current = label.index;

              echartInstance.dispatchAction({
                type: "downplay",
                seriesIndex: [0],
              });

              const echartInstanceOptions = echartInstance.getOption();

              const series = echartInstanceOptions.series;
              const data = series[0].data;

              const { start, end } = echartInstanceOptions.dataZoom[0]
                ? echartInstanceOptions.dataZoom[0]
                : { start: 0, end: 100 };

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
                type: "highlight",
                seriesIndex: 0,
                dataIndex,
              });
            }
          }}
        />
      </YAxisWrapper>

      <XAxisWrapper
        id="x-axis-wrapper"
        height={X_AXIS_WIDTH}
        width={camera ? heatmapCanvasSize.width : HEATMAP_ITEM_SIZE * size}
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

            const echartInstance = chartInstance?.getEchartsInstance();
            if (label.index === clickedLabelX.current) {
              echartInstance?.dispatchAction({
                type: "downplay",
                seriesIndex: 0,
              });
              clickedLabelX.current = -1;
            } else {
              clickedLabelX.current = label.index;

              echartInstance?.dispatchAction({
                type: "downplay",
                seriesIndex: [0],
              });

              const chartInstanceOptions = echartInstance.getOption();

              const series = chartInstanceOptions.series;
              const data = series[0].data;
              const { start, end } = chartInstanceOptions.dataZoom[1]
                ? chartInstanceOptions.dataZoom[1]
                : { start: 0, end: 100 };

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

              echartInstance?.dispatchAction({
                type: "highlight",
                seriesIndex: 0,
                dataIndex,
              });
            }
          }}
        />
      </XAxisWrapper>

      <StyledHeatmapWrapper>
        <ECharts
          xAxisLabelRef={clickedLabelX}
          yAxisLabelRef={clickedLabelY}
          onItemClicked={(item) => {
            if (XAxisChartRef.current && YAxisChartRef.current) {
              if (!item.length) {
                XAxisChartRef.current.changeActiveLabel(null);
                YAxisChartRef.current.changeActiveLabel(null);
              }

              emphasis !== "row" &&
                XAxisChartRef.current.changeActiveLabel(item[0]);
              emphasis !== "column" &&
                YAxisChartRef.current.changeActiveLabel(item[1]);
            }

            clickedLabelX.current = item[0];
            clickedLabelY.current = item[1];
          }}
          onAxisChange={(start, end, dir) => {
            // Scroll horizontally
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
                if (Y_AXIS_REVERSE) {
                  (
                    YAxisChartRef.current.getWrapperRef()
                      .current as HTMLDivElement
                  ).style.top = `${moveToBottom}px`;
                } else {
                  (
                    YAxisChartRef.current.getWrapperRef()
                      .current as HTMLDivElement
                  ).style.bottom = `${moveToBottom}px`;
                }
              }
            }
          }}
        />
      </StyledHeatmapWrapper>
    </StyledContainer>
  );
};

export default Heatmap;
