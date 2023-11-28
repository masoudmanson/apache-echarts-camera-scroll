import { useSelector } from "react-redux";
import { HeaderLeft, HeaderRight, StyledButtonIcon, StyledHeader, StyledIcon } from "./style";
import { RootState } from "../../store";
import { Button, Icon, Tooltip } from "@czi-sds/components";
import { useAppContext } from "../../store/useAppContext";

const Header = () => {
    const renderer = useSelector((state: RootState) => state.dataReducer.renderer);
    const { chartInstance } = useAppContext();

    return (
        <StyledHeader>
            <HeaderLeft>
                <StyledIcon sdsIcon="grid" sdsType="static" sdsSize="xl" color="gray" />
                <h3>Heatmap ({renderer === "svg" ? "SVG version" : "Canvas version"})</h3>
            </HeaderLeft>

            <HeaderRight>
                <Button
                    sdsType="primary"
                    sdsStyle="rounded"
                    endIcon={<Icon sdsIcon="download" sdsSize="l" sdsType="button" />}
                    onClick={() => saveAsImage("sds-heatmap")}
                >
                    Download as {renderer === "svg" ? ".svg" : ".png"}
                </Button>

                {/* Todo: Check the SDS tooltip component to fix these type errors */}
                <Tooltip
                    title="Change the heatmap renderer from the control panel, To switch between PNG or SVG exports. Selecting the SVG renderer will allow you to download a .svg version, while choosing the canvas renderer will provide the .png export option."
                    sdsStyle="light"
                    placement="bottom-end"
                    arrow
                >
                    <StyledButtonIcon sdsIcon="infoCircle" sdsSize="large" sdsType="secondary" />
                </Tooltip>
            </HeaderRight>
        </StyledHeader>
    );

    function saveAsImage(title: string) {
        const isSvg = renderer === 'svg';
        const type = isSvg ? 'svg' : 'png';
        const url = chartInstance?.getEchartsInstance().getConnectedDataURL({
            type: type,
            backgroundColor: 'transparent',
            excludeComponents: ['toolbox'],
            pixelRatio: 1
        });

        if (url) {
            const $a = document.createElement('a');
            $a.download = title + '.' + type;
            $a.target = '_blank';
            $a.href = url;
            const evt = new MouseEvent('click', {
                // some micro front-end framework， window maybe is a Proxy
                view: document.defaultView,
                bubbles: true,
                cancelable: false
            });
            $a.dispatchEvent(evt);
        }
    }
}

export default Header;