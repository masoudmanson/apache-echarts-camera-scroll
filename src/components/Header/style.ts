import { ButtonIcon, Icon } from "@czi-sds/components";
import { styled } from "@mui/material";

export const StyledHeader = styled("div")`
    grid-area: 1 / 1 / 2 / 6;
    border-bottom: solid 1px #eee;
    padding: 20px 15px;
    width: 100vw;
    height: 70px;
    background-color: white;
    position: fixed;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
        margin: 0;
    }
`;

export const HeaderLeft = styled("div")`
    display: flex;
`;

export const HeaderRight = styled("div")`
    display: flex;
`;

export const StyledIcon = styled(Icon)`
    margin: 0 10px;
`;

export const StyledButtonIcon = styled(ButtonIcon)`
    margin: 0 10px;
`;