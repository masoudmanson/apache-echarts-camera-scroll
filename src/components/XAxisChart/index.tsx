
import {
  forwardRef,
  useState,
} from "react";
import {
  XAxisContainer,
  XAxisLabel,
  GeneButtonStyle,
  XAxisGeneName,
  InfoButtonWrapper,
  HoverContainer,
} from "./style";
import {
  EXCLUDE_IN_SCREENSHOT_CLASS_NAME,
  SELECTED_STYLE,
  X_AXIS_CHART_HEIGHT_PX,
  formatLabel,
} from "./utils";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

export interface Gene {
  name: string;
  index: number;
}

interface Props {
  geneNames: Gene[];
  left: number;
  labelClicked: (gene: Gene) => void;
}

export const GENE_LABEL_HOVER_CONTAINER_ID = "gene-hover-container";

function GeneButton({
  active,
  gene,
  handleGeneClick,
}: {
  active?: boolean;
  gene: Gene;
  genesToDelete: string[];
  handleGeneClick: (gene: Gene) => void;
}): JSX.Element {
  const { name: geneName, index: geneIndex } = gene;
  const currentFont = `
    normal
    ${active ? SELECTED_STYLE.fontWeight : "normal"}
    ${SELECTED_STYLE.fontSize}px ${SELECTED_STYLE.fontFamily}
  `;
  const { text: formattedLabel, length } = formatLabel(
    `${geneName}`, 
    X_AXIS_CHART_HEIGHT_PX, // Gene label length is capped to this value
    currentFont
  );

  return (
    <GeneButtonStyle
      id={`gene-label-${geneName}`}
      onClick={() => {
        handleGeneClick(gene);
      }}
      active={active}
    >
      <HoverContainer id={GENE_LABEL_HOVER_CONTAINER_ID}>
        <InfoButtonWrapper className={EXCLUDE_IN_SCREENSHOT_CLASS_NAME}>
          {geneIndex}
        </InfoButtonWrapper>
      </HoverContainer>
      <XAxisLabel className={"gene-label-container"}>
        <XAxisGeneName
          font={currentFont}
          className={`gene-name-${geneName}`}
        >
          {formattedLabel}
        </XAxisGeneName>
      </XAxisLabel>
    </GeneButtonStyle>
  );
}

const XAxisChart = forwardRef(
  (
    { geneNames, left, labelClicked }: Props,
    ref: React.LegacyRef<HTMLDivElement>
  ): JSX.Element => {
    const heatmapCanvasSize = useSelector(
      (state: RootState) => state.dataReducer.heatmapCanvasSize
    );

    // This is used to calculate the current longest gene name
    const [activeGene, setActiveGene] = useState<number | null>(null);

    return (
      <XAxisContainer
        className="gene-labels"
        width={heatmapCanvasSize.width}
        height={150}
        left={left}
        ref={ref}
      >
        {geneNames.map((gene) => (
          <GeneButton
            key={gene.name}
            gene={gene}
            genesToDelete={[""]}
            active={activeGene === gene.index}
            handleGeneClick={(gene) => {
              if (activeGene === gene.index) {
                setActiveGene(null);
              } else {
                setActiveGene(gene.index);
              }
              labelClicked(gene);
            }}
          />
        ))}
      </XAxisContainer>
    );
  }
);

export default XAxisChart;
