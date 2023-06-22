import styled from "@emotion/styled";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  Y_ITEM_COUNT,
  X_ITEM_COUNT,
  ECHART_AXIS_LABEL_COLOR_HEX,
  ECHART_AXIS_LABEL_FONT_SIZE_PX,
} from "../utils";

interface YAxisWrapperProps {
  height: number;
  width: number;
  bottom: number;
}

export const YAxisWrapper = styled.div<YAxisWrapperProps>`
  ${yAxisWidthAndOffset}
  background-color: white;
  height: ${(props) => props.height}px;
  position: absolute;
  overflow: hidden;
  z-index: 2;
  border-right: solid 1px #666;
`;

interface YAxisContainerProps {
  height: number;
  width: number;
}

export const YAxisContainer = styled.div<YAxisContainerProps>`
  ${yAxisWidth}
  background-color: white;
  height: ${(props) => props.height}px;
  left: 0px;
  position: absolute;
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-between;
`;

export const YAxisLabel = styled.div`
  ${() => {
    const heatmapCanvasSize = useSelector(
      (state: RootState) => state.dataReducer.heatmapCanvasSize
    );
    return `
    height: ${heatmapCanvasSize.height / Y_ITEM_COUNT}px;
    width: 100%;
    color: ${ECHART_AXIS_LABEL_COLOR_HEX};
    display: flex;
    justify-content: end;
    align-items: center;
    padding-right: 25px;
    &::before {
        content: "";
        position: absolute;
        height: 1px;
        width: 5px;
        background-color: #666;
        margin-top: 25px;
        right: 0;
    }`;
  }}
`;

export const YAxisGeneName = styled.span`
  ${selectedStyle}
`;

export const InfoButtonWrapper = styled.div`
  transform: scale(1, 1);
  cursor: pointer;
  display: flex;
  margin-bottom: 4px;
  margin-top: 4px;
  justify-content: center;
  font-size: 10px;
`;

export const DeleteButtonWrapper = styled.div`
  cursor: pointer;
`;

interface GeneButtonProps {
  active?: boolean;
}

export const GeneButtonStyle = styled.div<GeneButtonProps>`
  ${(props) => {
    return `
        background-color: white;
        border: none;
        z-index: 2;
        display: inline-flex;
        justify-content: space-between;
        white-space: nowrap;
        flex-direction: row;
        align-items: center;

        &:hover {
            ${activeStyle()}
        }

        ${props.active ? activeStyle() : null}
    `;
  }}
`;

export const HoverContainer = styled.div`
  display: flex;
  flex-direction: row;
  opacity: 0.1;
  position: absolute;
  right: 0;
  padding-right: 8px;
  z-index: 3;
`;

export const CellCountLabel = styled.div`
  ${() => {
    const heatmapCanvasSize = useSelector(
      (state: RootState) => state.dataReducer.heatmapCanvasSize
    );
    return `
        font: ${ECHART_AXIS_LABEL_FONT_SIZE_PX}px sans-serif;
        color: ${ECHART_AXIS_LABEL_COLOR_HEX};
        width: ${heatmapCanvasSize.width / X_ITEM_COUNT}px;
        height: 100%;
        writing-mode: vertical-rl;
        position: absolute;
        left: ${heatmapCanvasSize.width / X_ITEM_COUNT}px;
        transform: scale(-1, -1);`;
  }}
`;

function yAxisWidthAndOffset({
  width,
  bottom,
}: {
  width: number;
  bottom: number;
}) {
  return `
    width: ${width}px;
    bottom: ${bottom}px;
  `;
}

function yAxisWidth({ width }: { width: number }) {
  return `
    width: ${width}px;
  `;
}

function selectedStyle({ font }: { font: string }) {
  return `
      font: ${font};
      background-color: "white";
    `;
}

function activeStyle() {
  return `
    cursor: pointer;
    #gene-hover-container {
      visibility: visible;
    }
    background-color: #f3f3f3;
    .gene-label-container span {
        color: black;
        font-weight: 600;
    }
    .y-axis-hover-container {
      opacity: 1;
    }`;
}
