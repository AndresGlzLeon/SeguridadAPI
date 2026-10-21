import { createBrowserRouter, Navigate } from "react-router";
import { DashboardLayout } from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { InventarioGlobal } from "./pages/InventarioGlobal";
import { GestionProductos } from "./pages/GestionProductos";
import { ReporteDiscrepancias } from "./pages/ReporteDiscrepancias";
import { MapaAlmacen } from "./pages/MapaAlmacen";
import { GestionSurtidos } from "./pages/GestionSurtidos";
import { BitacoraAuditoria } from "./pages/BitacoraAuditoria";
import { GestionUsuarios } from "./pages/GestionUsuarios";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: InventarioGlobal },
      { path: "inventario", Component: InventarioGlobal },
      { path: "productos", Component: GestionProductos },
      { path: "surtidos", Component: GestionSurtidos },
      { path: "discrepancias", Component: ReporteDiscrepancias },
      { path: "mapa", Component: MapaAlmacen },
      { path: "auditoria", Component: BitacoraAuditoria },
      { path: "usuarios", Component: GestionUsuarios },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);