import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import SignUp from "../pages/SignUp";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <div>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<SignUp />} />

          {/* Rutas Privadas */}
          {/* <Route element={<ProtectedRoute user={user} redirectPath="/login" />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route> */}

          {/* Ruta para 404*/}
          <Route path="*" element={<h1>404: Página no encontrada</h1>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};
