import { useDispatch, useSelector } from "react-redux";
import {
  Callout,
  DefaultAutocompleteOption,
  Dropdown,
  SDSAutocompleteValue,
  Tag,
} from "@czi-sds/components";
import { StyledControlPanelWrapper, StyledForm, StyledLabel } from "./style";
import {
  DataState,
  setCamera,
  setColor,
  setEmphasis,
  setRenderer,
  setSize,
  setSymbol,
  setType,
} from "../../store/dataReducer";
import { RootState } from "../../store";
import { toPascalCase } from "../utils";

type DropdownOption = DefaultAutocompleteOption & {
  value: string | number | boolean;
}

const OPTIONS = [
  { name: "Spectral", value: "Spectral", section: "Categorical" },
  { name: "Rainbow", value: "Rainbow", section: "Categorical" },
  { name: "Virdis", value: "Virdis", section: "Categorical" },
  { name: "Plasma", value: "Plasma", section: "Categorical" },
  { name: "Magma", value: "Magma", section: "Sequential" },
  { name: "YlOrRd", value: "YlOrRd", section: "Sequential" },
];

const SIZES = [
  { name: "2,500", details: "50 x 50", value: 50 },
  { name: "10,000", details: "100 x 100", value: 100 },
  { name: "62,500", details: "250 x 250", value: 250 },
  { name: "250,000", details: "500 x 500", value: 500 },
  { name: "562,500", details: "750 x 750", value: 750 },
  { name: "1,000,000", details: "1000 x 1000", value: 1000 },
  { name: "1,562,500", details: "1250 x 1250", value: 1250 },
  { name: "2,250,000", details: "1500 x 1500", value: 1500 },
  { name: "2,722,500", details: "1650 x 1650", value: 1650 },
];

const TYPES = [
  {
    name: "Sequential",
    details: "Applies gradient-like colors for a smooth transition.",
    value: "sequential"
  },
  {
    name: "Random",
    details: "Utilizes randomized colors for a diverse visual representation.",
    value: "random"
  },
  {
    name: "Perlin",
    details: "Incorporates Perlin noise for a structured yet natural appearance.",
    value: "perlin"
  },
];

const SYMBOLS = [
  {
    name: "Circle",
    details:
      "Represents data points as circular shapes with varying sizes and colors based on their values.",
    value: "circle"
  },
  {
    name: "Rect",
    details:
      "Represents data points as rectangular shapes with different colors based on their values.",
    value: "rect"
  },
  {
    name: "RoundRect",
    details:
      "Represents data points as rounded-edged rectangular shapes with different colors based on their values.",
    value: "roundRect"
  },
];

const EMPHASIS = [
  {
    name: "Item",
    details: "Highlights only the specific item.",
    value: "item"
  },
  {
    name: "Row",
    details: "Highlights the entire row containing the item.",
    value: "row"
  },
  {
    name: "Column",
    details: "Highlights the entire column containing the item.",
    value: "column"
  },
  {
    name: "Cross",
    details: "Highlights both the row and column containing the item.",
    value: "cross"
  },
];

const CAMERA_EFFECT = [
  {
    name: "On",
    details: "Renders only the visible part of the heatmap, rendering the rest upon scrolling. Recommended for large heatmaps to optimize performance.",
    value: true
  },
  {
    name: "Off",
    details: "Renders the entire heatmap on the screen. Suitable for smaller heatmaps where the camera effect can be disabled for better display.",
    value: false
  },
];

const RENDERER = [
  {
    name: "svg",
    details: "Renders the heatmap in SVG format.",
    value: "svg"
  },
  {
    name: "canvas",
    details: "Renders the heatmap using HTML canvas.",
    value: "canvas"
  },
];

const ControlPanel: React.FC = () => {
  const dispatch = useDispatch();

  const size = useSelector((state: RootState) => state.dataReducer.size);
  const color = useSelector((state: RootState) => state.dataReducer.color);
  const type = useSelector((state: RootState) => state.dataReducer.type);
  const renderer = useSelector((state: RootState) => state.dataReducer.renderer);
  const camera = useSelector((state: RootState) => state.dataReducer.camera);
  const symbol = useSelector((state: RootState) => state.dataReducer.symbol);
  const emphasis = useSelector(
    (state: RootState) => state.dataReducer.emphasis
  );

  return (
    <StyledControlPanelWrapper>
      <StyledForm>
        <h5>Control Panel</h5>

        <Dropdown<DropdownOption, false, false, false>
          label={color}
          options={OPTIONS}
          onChange={changeInterpolator}
          search
          InputDropdownProps={{
            label: "Heatmap Color",
            value: color,
            sdsType: "label",
            sdsStyle: "minimal",
            style: {
              marginBottom: 5
            }
          }}
          DropdownMenuProps={{
            width: 220,
            groupBy: (option: DropdownOption) =>
              option.section as string,
          }}
        />

        <Dropdown<DropdownOption, false, false, false>
          label={`${size} x ${size}`}
          options={SIZES}
          onChange={changeHeatmapSize}
          InputDropdownProps={{
            label: "Heatmap Size",
            value: `${size} x ${size}`,
            sdsType: "label",
            sdsStyle: "minimal",
            style: {
              marginBottom: 5
            }
          }}
          DropdownMenuProps={{
            width: 220,
          }}
        />

        <Dropdown<DropdownOption, false, false, false>
          label={camera ? "on" : "off"}
          options={CAMERA_EFFECT}
          onChange={changeHeatmapCamera}
          InputDropdownProps={{
            label: "Camera Effect",
            value: camera ? "On" : "Off",
            sdsType: "label",
            sdsStyle: "minimal",
            style: {
              marginBottom: 5
            }
          }}
          DropdownMenuProps={{
            width: 220,
          }}
        />

        <Dropdown<DropdownOption, false, false, false>
          label={toPascalCase(renderer)}
          options={RENDERER}
          onChange={changeHeatmapRenderer}
          InputDropdownProps={{
            label: "Renderer",
            value: toPascalCase(renderer),
            sdsType: "label",
            sdsStyle: "minimal",
            style: {
              marginBottom: 5
            }
          }}
          DropdownMenuProps={{
            width: 220,
          }}
        />

        <Dropdown<DropdownOption, false, false, false>
          label={type}
          options={TYPES}
          onChange={changeHeatmapType}
          InputDropdownProps={{
            label: "Heatmap Type",
            value: toPascalCase(type),
            sdsType: "label",
            sdsStyle: "minimal",
            style: {
              marginBottom: 5
            }
          }}
          DropdownMenuProps={{
            width: 220,
          }}
        />

        <Dropdown<DropdownOption, false, false, false>
          label={symbol}
          options={SYMBOLS}
          onChange={changeHeatmapSymbol}
          InputDropdownProps={{
            label: "Symbol Type",
            value: toPascalCase(symbol),
            sdsType: "label",
            sdsStyle: "minimal",
            style: {
              marginBottom: 5
            }
          }}
          DropdownMenuProps={{
            width: 220,
          }}
        />

        <Dropdown<DropdownOption, false, false, false>
          label={emphasis}
          options={EMPHASIS}
          onChange={changeHeatmapEmphasis}
          InputDropdownProps={{
            label: "Emphasis Type",
            value: toPascalCase(emphasis),
            sdsType: "label",
            sdsStyle: "minimal",
            style: {
              marginBottom: 5
            }
          }}
          DropdownMenuProps={{
            width: 220,
          }}
        />
      </StyledForm>

      <Callout
        autoDismiss={false}
        intent="info"
        dismissed={false}
        style={{
          width: "unset",
          margin: 0,
        }}
      >
        To scroll horizontally, hold down the{" "}
        <Tag
          color="gray"
          label="SHIFT"
          sdsStyle="square"
          sdsType="secondary"
          hover={false}
          style={{ marginTop: 5 }}
        />{" "}
        key!
      </Callout>
    </StyledControlPanelWrapper>
  );

  function changeInterpolator(
    _event: React.SyntheticEvent,
    interpolator: SDSAutocompleteValue<DropdownOption, false, false, false>
  ) {
    interpolator && dispatch(setColor(interpolator.value as DataState["color"]));
  }

  function changeHeatmapSize(
    _event: React.SyntheticEvent,
    size: SDSAutocompleteValue<DropdownOption, false, false, false>
  ) {
    size && dispatch(setSize(size.value as DataState["size"]));
  }

  function changeHeatmapType(
    _event: React.SyntheticEvent,
    type: SDSAutocompleteValue<DropdownOption, false, false, false>
  ) {
    type && dispatch(setType(type.value as DataState["type"]));
  }

  function changeHeatmapRenderer(
    _event: React.SyntheticEvent,
    renderer: SDSAutocompleteValue<DropdownOption, false, false, false>
  ) {
    renderer && dispatch(setRenderer(renderer.value as DataState["renderer"]));
  }

  function changeHeatmapCamera(
    _event: React.SyntheticEvent,
    camera: SDSAutocompleteValue<DropdownOption, false, false, false>
  ) {
    camera && dispatch(setCamera(camera.value as DataState["camera"]));
  }

  function changeHeatmapSymbol(
    _event: React.SyntheticEvent,
    symbol: SDSAutocompleteValue<DropdownOption, false, false, false>
  ) {
    symbol && dispatch(setSymbol(symbol.value as DataState["symbol"]));
  }

  function changeHeatmapEmphasis(
    _event: React.SyntheticEvent,
    emphasis: SDSAutocompleteValue<DropdownOption, false, false, false>
  ) {
    emphasis && dispatch(setEmphasis(emphasis.value as DataState["emphasis"]));
  }
};

export default ControlPanel;
