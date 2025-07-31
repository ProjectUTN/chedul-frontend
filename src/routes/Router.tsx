import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";
import Inicio from "../pages/Inicio";
import { ProtectedRoute } from "./ProtectedRoute";
import Estado from "../pages/Estado";
import Layout from "../layouts/Layout";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/estado" element={<Estado />} />
        </Route>

        {/* Rutas Privadas
        TODO: por ahora lo saco */}

        {/* <Route element={<ProtectedRoute redirectPath="/login" />}>
          <Route element={<Layout />}>
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/estado" element={<Estado />} />
          </Route>
        </Route> */}

        {/* Ruta para 404*/}
        <Route path="*" element={<h1>404: Página no encontrada</h1>} />
      </Routes>
    </BrowserRouter>
  );
};
