import Heatmap from "./components/Heatmap";
import ControlPanel from "./components/ControlPanel";
import { Container, Main, Sidebar } from "./style";

function App() {
  return (
    <Container>
      <Sidebar>
        <ControlPanel />
      </Sidebar>
      <Main>
        <Heatmap />
      </Main>
    </Container>
  );
}

export default App;
