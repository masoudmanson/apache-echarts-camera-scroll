import { styled } from "@mui/material";

export const Container = styled("div")`
    font-family: Open sans;
    display: grid;
    grid-column-gap: 0;
    grid-row-gap: 0;
    grid-template-columns: 250px 1fr;
    grid-template-rows: 1fr;

    h3 {
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 15px 0;
    }
`;

export const Sidebar = styled("div")`
    border-right: solid 1px #eee;
    padding: 20px 15px;
    height: 100vh;
`;

export const Main = styled("div")`
    padding: 20px 25px;

    .echarts-for-react {
        height: unset !important;
    }
`;
