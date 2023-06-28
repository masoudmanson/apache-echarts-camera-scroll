import { useDispatch, useSelector } from "react-redux";
import {
  Callout,
  CalloutTitle,
  DefaultDropdownMenuOption,
  Dropdown,
  Tag,
} from "@czi-sds/components";
import { StyledControlPanelWrapper, StyledForm, StyledLabel } from "./style";
import { useSnackbar } from "notistack";
import {
  DataState,
  setColor,
  setEmphasis,
  setSize,
  setSymbol,
  setType,
} from "../../store/dataReducer";
import { RootState } from "../../store";

const OPTIONS = [
  { name: "Spectral", section: "Categorical" },
  { name: "Rainbow", section: "Categorical" },
  { name: "Virdis", section: "Categorical" },
  { name: "Plasma", section: "Categorical" },
  { name: "Magma", section: "Sequential" },
  { name: "YlOrRd", section: "Sequential" },
];

const SIZES: DefaultDropdownMenuOption[] = [
  { name: "10,000", details: "100 x 100" },
  { name: "62,500", details: "250 x 250" },
  { name: "250,000", details: "500 x 500" },
  { name: "562,500", details: "750 x 750" },
  { name: "1,000,000", details: "1000 x 1000" },
  { name: "1,562,500", details: "1250 x 1250" },
  { name: "2,250,000", details: "1500 x 1500" },
  { name: "2,722,500", details: "1650 x 1650" },
];

const TYPES = [
  {
    name: "Sequential",
  },
  {
    name: "Random",
  },
  {
    name: "Perlin noise",
  },
];

const SYMBOLS = [
  {
    name: "Circle",
    details:
      "Represents data points as circular shapes with varying sizes and colors based on their values.",
  },
  {
    name: "Rect",
    details:
      "Represents data points as rectangular shapes with different colors based on their values.",
  },
  {
    name: "RoundRect",
    details:
      "Represents data points as rounded-edged rectangular shapes with different colors based on their values.",
  },
];

const EMPHASIS = [
  {
    name: "Item",
    details: "Highlights only the specific item.",
  },
  {
    name: "Row",
    details: "Highlights the entire row containing the item.",
  },
  {
    name: "Column",
    details: "Highlights the entire column containing the item.",
  },
  {
    name: "Cross",
    details: "Highlights both the row and column containing the item.",
  },
];

const ControlPanel: React.FC = () => {
  const dispatch = useDispatch();

  const size = useSelector((state: RootState) => state.dataReducer.size);
  const color = useSelector((state: RootState) => state.dataReducer.color);
  const type = useSelector((state: RootState) => state.dataReducer.type);
  const symbol = useSelector((state: RootState) => state.dataReducer.symbol);
  const emphasis = useSelector(
    (state: RootState) => state.dataReducer.emphasis
  );

  return (
    <StyledControlPanelWrapper>
      <StyledForm>
        <h3>Contorl Panel</h3>

        <StyledLabel>HEATMAP COLOR</StyledLabel>
        <Dropdown
          label={color}
          options={OPTIONS}
          onChange={changeInterpolator}
          search
          InputDropdownProps={{
            sdsType: "singleSelect",
            sdsStyle: "minimal",
          }}
          DropdownMenuProps={{
            PopperBaseProps: {
              sx: { width: 220 },
            },
            groupBy: (option: DefaultDropdownMenuOption) =>
              option.section as string,
          }}
        />

        <StyledLabel>HEATMAP SIZE</StyledLabel>
        <Dropdown
          label={`${size} x ${size}`}
          options={SIZES}
          onChange={changeHeatmapSize}
          InputDropdownProps={{
            sdsType: "singleSelect",
            sdsStyle: "minimal",
          }}
          DropdownMenuProps={{
            PopperBaseProps: {
              sx: { width: 220 },
            },
          }}
        />

        <StyledLabel>HEATMAP TYPE</StyledLabel>
        <Dropdown
          label={type}
          options={TYPES}
          onChange={changeHeatmapType}
          InputDropdownProps={{
            sdsType: "singleSelect",
            sdsStyle: "minimal",
          }}
          DropdownMenuProps={{
            PopperBaseProps: {
              sx: { width: 220 },
            },
          }}
        />

        <StyledLabel>SYMBOL TYPE</StyledLabel>
        <Dropdown
          label={symbol}
          options={SYMBOLS}
          onChange={changeHeatmapSymbol}
          InputDropdownProps={{
            sdsType: "singleSelect",
            sdsStyle: "minimal",
          }}
          DropdownMenuProps={{
            PopperBaseProps: {
              sx: { width: 220 },
            },
          }}
        />

        <StyledLabel>EMPHASIS TYPE</StyledLabel>
        <Dropdown
          label={emphasis}
          options={EMPHASIS}
          onChange={changeHeatmapEmphasis}
          InputDropdownProps={{
            sdsType: "singleSelect",
            sdsStyle: "minimal",
          }}
          DropdownMenuProps={{
            PopperBaseProps: {
              sx: { width: 220 },
            },
          }}
        />
      </StyledForm>

      <Callout
        autoDismiss={false}
        intent="warning"
        dismissed={false}
        style={{
          width: "unset",
          margin: 0,
        }}
      >
        To scroll horizontally, hold down the{" "}
        <Tag
          color="warning"
          label="SHIFT"
          sdsStyle="square"
          sdsType="primary"
          hover={false}
          style={{ marginTop: 5 }}
        />{" "}
        key!
      </Callout>
    </StyledControlPanelWrapper>
  );

  function changeInterpolator(interpolator: DefaultDropdownMenuOption | null) {
    interpolator && dispatch(setColor(interpolator.name));
  }

  function changeHeatmapSize(size: DefaultDropdownMenuOption | null) {
    size &&
      size.name &&
      dispatch(setSize(Math.sqrt(parseInt(size.name.split(",").join("")))));
  }

  function changeHeatmapType(type: DefaultDropdownMenuOption | null) {
    type && dispatch(setType(type.name as DataState["type"]));
  }

  function changeHeatmapSymbol(symbol: DefaultDropdownMenuOption | null) {
    symbol && dispatch(setSymbol(symbol.name as DataState["symbol"]));
  }

  function changeHeatmapEmphasis(emphasis: DefaultDropdownMenuOption | null) {
    emphasis && dispatch(setEmphasis(emphasis.name as DataState["emphasis"]));
  }
};

export default ControlPanel;
