import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppRouter } from "./routes/Router";
import useTema from "./hooks/useTema";
import "./styles.css";

function App() {
  const { tema } = useTema();
  return (
    <>
      <AppRouter />
      <ToastContainer limit={3} position="bottom-right" theme={tema === "claro" ? "light" : "dark"} autoClose={3000} />
    </>
  );
}

export default App;
