import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Catalogo from './pages/Catalogo';
import ProductoForm from './pages/ProductoForm';
import EntradaInventario from './pages/EntradaInventario';
import SalidaInventario from './pages/SalidaInventario';
import ProductosDanados from './pages/ProductosDanados';
import Proveedores from './pages/Proveedores';
import ProveedorForm from './pages/ProveedorForm';
import ProveedorDetalle from './pages/ProveedorDetalle';
import Usuarios from './pages/Usuarios';
import Marcas from './pages/Marcas';
import RolesPermisos from './pages/RolesPermisos';
import ReporteInventario from './pages/ReporteInventario';
import ReportesFinancieros from './pages/ReportesFinancieros';
import Perfil from './pages/Perfil';
import CatalogoPublico from './pages/CatalogoPublico';
import RegistroCliente from './pages/RegistroCliente';

function PrivateRoute({ children, permission }: { children: React.ReactNode; permission?: string }) {
  const { user, loading, hasPermission } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/tienda" element={<CatalogoPublico />} />
      <Route path="/registro" element={<RegistroCliente />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="catalogo" element={<PrivateRoute permission="catalogo_ver"><Catalogo /></PrivateRoute>} />
        <Route path="catalogo/marcas" element={<PrivateRoute permission="catalogo_editar"><Marcas /></PrivateRoute>} />
        <Route path="catalogo/nuevo" element={<PrivateRoute permission="catalogo_editar"><ProductoForm /></PrivateRoute>} />
        <Route path="catalogo/editar/:id" element={<PrivateRoute permission="catalogo_editar"><ProductoForm /></PrivateRoute>} />
        <Route path="entrada" element={<PrivateRoute permission="entrada_inventario"><EntradaInventario /></PrivateRoute>} />
        <Route path="salida" element={<PrivateRoute permission="entrada_inventario"><SalidaInventario /></PrivateRoute>} />
        <Route path="productos-danados" element={<PrivateRoute permission="entrada_inventario"><ProductosDanados /></PrivateRoute>} />
        <Route path="reporte-inventario" element={<PrivateRoute><ReporteInventario /></PrivateRoute>} />
        <Route path="reportes" element={<PrivateRoute><ReportesFinancieros /></PrivateRoute>} />
        <Route path="perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
        <Route path="proveedores" element={<PrivateRoute permission="proveedores_ver"><Proveedores /></PrivateRoute>} />
        <Route path="proveedores/nuevo" element={<PrivateRoute permission="proveedores_editar"><ProveedorForm /></PrivateRoute>} />
        <Route path="proveedores/editar/:id" element={<PrivateRoute permission="proveedores_editar"><ProveedorForm /></PrivateRoute>} />
        <Route path="proveedores/:id" element={<PrivateRoute permission="proveedores_ver"><ProveedorDetalle /></PrivateRoute>} />
        <Route path="usuarios" element={<PrivateRoute permission="usuarios_gestionar"><Usuarios /></PrivateRoute>} />
        <Route path="usuarios/roles-permisos" element={<PrivateRoute permission="permisos_asignar"><RolesPermisos /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
