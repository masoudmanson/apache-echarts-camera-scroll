import Heatmap from "./components/Heatmap";
import ControlPanel from "./components/ControlPanel";
import { Container, Main, Sidebar } from "./style";
import Header from "./components/Header";
import { AppContext } from "./store/AppContext";
import { useState } from "react";
import { EChartsInstance } from "echarts-for-react";

function App() {
  const [chartInstance, setChartInstance] = useState<EChartsInstance | null>(null);

  return (
    <AppContext.Provider value={{ chartInstance, setChartInstance }}>
      <Container>
        <Header />
        <Sidebar>
          <ControlPanel />
        </Sidebar>
        <Main>
          <Heatmap />
        </Main>
      </Container>
    </AppContext.Provider>
  );
}

export default App;
