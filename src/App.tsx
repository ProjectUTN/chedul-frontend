import { AppRouter } from "./routes/Router";
import Confirmacion from "./components/Confirmacion";
import Eleccion from "./components/Eleccion";
import Avisos from "./components/Avisos";
// Aplica el tema guardado apenas carga la app
import "./hooks/useTema";
import "./styles.css";

function App() {
  return (
    <>
      <AppRouter />
      <Confirmacion />
      <Eleccion />
      <Avisos />
    </>
  );
}

export default App;
