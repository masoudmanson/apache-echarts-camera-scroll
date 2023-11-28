import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createNoise2D } from "simplex-noise";
import { Gene } from "../components/XAxisChart";
import GeneListGenerator from "../helpers/geneListGenerator";
import {
  HEATMAP_DEFAULT_SIZE,
  HEATMAP_ITEM_SIZE,
  X_ITEM_COUNT,
  Y_ITEM_COUNT,
} from "../components/utils";

export interface DataState {
  data: (number | string)[][];
  size: number;
  type: "random" | "sequential" | "perlin";
  camera: boolean;
  symbol: "circle" | "rect" | "roundRect";
  renderer: "svg" | "canvas";
  emphasis: "item" | "row" | "column" | "cross";
  color: string;
  geneNames: Gene[];
  heatmapCanvasSize: { width: number; height: number };
}

const initialState: DataState = {
  data: generateData("perlin", HEATMAP_DEFAULT_SIZE),
  size: HEATMAP_DEFAULT_SIZE,
  type: "perlin",
  camera: true,
  symbol: "rect",
  renderer: "svg",
  color: "Magma",
  emphasis: "cross",
  geneNames: GeneListGenerator(HEATMAP_DEFAULT_SIZE),
  heatmapCanvasSize: {
    width: HEATMAP_ITEM_SIZE * (X_ITEM_COUNT),
    height: HEATMAP_ITEM_SIZE * (Y_ITEM_COUNT),
  },
};

function generateData(type: string, size: number) {
  switch (type) {
    case "sequential":
      return Array.from({ length: size }, (_, i) =>
        Array.from({ length: size }, (_, j) => [i, j, (i + j) / (2 * size)])
      ).flat();

    case "random":
      return Array.from({ length: size }, (_, i) =>
        Array.from({ length: size }, (_, j) => [i, j, Math.random()])
      ).flat();

    case "perlin":
    default: {
      const noise2D = createNoise2D();
      const noiseSeed = Math.floor(size / 20);

      return Array.from({ length: size }, (_, i) =>
        Array.from({ length: size }, (_, j) => [
          i,
          j,
          (noise2D(i / noiseSeed, j / noiseSeed) + 1) * 0.5,
        ])
      ).flat();
    }
  }
}

export const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<DataState["data"]>) => {
      state.data = action.payload;
    },
    setSize: (state, action: PayloadAction<DataState["size"]>) => {
      state.size = action.payload;
      state.data = generateData(state.type, action.payload);
      state.geneNames = GeneListGenerator(action.payload);
    },
    setType: (state, action: PayloadAction<DataState["type"]>) => {
      state.type = action.payload;
      state.data = generateData(action.payload, state.size);
    },
    setCamera: (state, action: PayloadAction<DataState["camera"]>) => {
      state.camera = action.payload;
    },
    setColor: (state, action: PayloadAction<DataState["color"]>) => {
      state.color = action.payload;
    },
    setSymbol: (state, action: PayloadAction<DataState["symbol"]>) => {
      state.symbol = action.payload;
    },
    setRenderer: (state, action: PayloadAction<DataState["renderer"]>) => {
      state.renderer = action.payload;
    },
    setEmphasis: (state, action: PayloadAction<DataState["emphasis"]>) => {
      state.emphasis = action.payload;
    },
    setGeneNames: (state, action: PayloadAction<DataState["geneNames"]>) => {
      state.geneNames = action.payload;
    },
    setHeatmapCanvasSize: (
      state,
      action: PayloadAction<DataState["heatmapCanvasSize"]>
    ) => {
      state.heatmapCanvasSize = action.payload;
    },
  },
});

export const {
  setData,
  setSize,
  setType,
  setCamera,
  setColor,
  setSymbol,
  setRenderer,
  setEmphasis,
  setGeneNames,
  setHeatmapCanvasSize,
} = dataSlice.actions;

export default dataSlice.reducer;
