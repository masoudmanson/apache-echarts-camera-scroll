import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  YAxisContainer,
  YAxisLabel,
  GeneButtonStyle,
  YAxisGeneName,
  InfoButtonWrapper,
  HoverContainer,
} from "./style";
import { SELECTED_STYLE, Y_AXIS_WIDTH, formatLabel } from "../utils";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

export interface Gene {
  name: string;
  index: number;
}

interface Props {
  geneNames: Gene[];
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
    Y_AXIS_WIDTH - 40, // Gene label length is capped to this value
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
      <HoverContainer
        className="y-axis-hover-container"
        id={GENE_LABEL_HOVER_CONTAINER_ID}
      >
        <InfoButtonWrapper>{geneIndex}</InfoButtonWrapper>
      </HoverContainer>
      <YAxisLabel className={"gene-label-container"}>
        <YAxisGeneName font={currentFont}>{formattedLabel}</YAxisGeneName>
      </YAxisLabel>
    </GeneButtonStyle>
  );
}

export interface YAxisRefType {
  changeActiveLabel: (label: number) => void;
  getWrapperRef: () => React.RefObject<HTMLDivElement | null>;
}

const YAxisChart = forwardRef(
  (
    { geneNames, labelClicked }: Props,
    ref: React.Ref<YAxisRefType>
  ): JSX.Element => {
    const heatmapCanvasSize = useSelector(
      (state: RootState) => state.dataReducer.heatmapCanvasSize
    );

    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => {
      return {
        changeActiveLabel(label: number) {
          setActiveGene(label);
        },
        getWrapperRef() {
          return wrapperRef;
        },
      };
    });

    const [activeGene, setActiveGene] = useState<number | null>(null);

    return (
      <YAxisContainer
        className="gene-labels"
        width={Y_AXIS_WIDTH}
        height={heatmapCanvasSize.width}
        ref={wrapperRef}
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
      </YAxisContainer>
    );
  }
);

export default YAxisChart;
