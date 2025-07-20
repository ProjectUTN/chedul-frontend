import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";
import Inicio from "../pages/Inicio";
import { ProtectedRoute } from "./ProtectedRoute";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <div>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<SignUp />} />
          <Route path="/login" element={<Login />} />

          {/* Rutas Privadas */}

          <Route element={<ProtectedRoute redirectPath="/login" />}>
            <Route path="/inicio" element={<Inicio />} />
          </Route>

          {/* Ruta para 404*/}
          <Route path="*" element={<h1>404: Página no encontrada</h1>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};
