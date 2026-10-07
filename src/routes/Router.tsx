import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";
import Inicio from "../pages/Inicio";
import { ProtectedRoute, PublicOnlyRoute } from "./ProtectedRoute";
import Estado from "../pages/Estado";
import Layout from "../layouts/Layout";
import Mails from "../pages/Mails";
import Aportes from "../pages/Aportes";
import FormularioAporte from "../pages/FormularioAporte";
import Calendario from "../pages/Calendario";
import MapaCorrelativas from "../pages/MapaCorrelativas";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/registro" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Rutas privadas */}
        <Route element={<ProtectedRoute redirectPath="/login" />}>
          <Route element={<Layout />}>
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/estado" element={<Estado />} />
            <Route path="/aportes" element={<Aportes />} />
            <Route path="/aportes/nuevo" element={<FormularioAporte />} />
            <Route path="/aportes/:id/editar" element={<FormularioAporte />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/correlativas" element={<MapaCorrelativas />} />
            <Route path="/correos" element={<Mails />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/inicio" replace />} />

        {/* Ruta para 404 */}
        <Route path="*" element={<h1 className="no-encontrada">404: Página no encontrada</h1>} />
      </Routes>
    </BrowserRouter>
  );
};
