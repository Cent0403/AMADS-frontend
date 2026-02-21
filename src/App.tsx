import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { PERMISOS } from './constants/permissions';
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
        <Route path="catalogo" element={<PrivateRoute permission={PERMISOS.CATALOGO_VER}><Catalogo /></PrivateRoute>} />
        <Route path="catalogo/marcas" element={<PrivateRoute permission={PERMISOS.CATALOGO_EDITAR}><Marcas /></PrivateRoute>} />
        <Route path="catalogo/nuevo" element={<PrivateRoute permission={PERMISOS.CATALOGO_EDITAR}><ProductoForm /></PrivateRoute>} />
        <Route path="catalogo/editar/:id" element={<PrivateRoute permission={PERMISOS.CATALOGO_EDITAR}><ProductoForm /></PrivateRoute>} />
        <Route path="entrada" element={<PrivateRoute permission={PERMISOS.ENTRADA_INVENTARIO}><EntradaInventario /></PrivateRoute>} />
        <Route path="salida" element={<PrivateRoute permission={PERMISOS.ENTRADA_INVENTARIO}><SalidaInventario /></PrivateRoute>} />
        <Route path="productos-danados" element={<PrivateRoute permission={PERMISOS.ENTRADA_INVENTARIO}><ProductosDanados /></PrivateRoute>} />
        <Route path="reporte-inventario" element={<PrivateRoute permission={PERMISOS.REPORTES_VER}><ReporteInventario /></PrivateRoute>} />
        <Route path="reportes" element={<PrivateRoute permission={PERMISOS.REPORTES_VER}><ReportesFinancieros /></PrivateRoute>} />
        <Route path="perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
        <Route path="proveedores" element={<PrivateRoute permission={PERMISOS.PROVEEDORES_VER}><Proveedores /></PrivateRoute>} />
        <Route path="proveedores/nuevo" element={<PrivateRoute permission={PERMISOS.PROVEEDORES_EDITAR}><ProveedorForm /></PrivateRoute>} />
        <Route path="proveedores/editar/:id" element={<PrivateRoute permission={PERMISOS.PROVEEDORES_EDITAR}><ProveedorForm /></PrivateRoute>} />
        <Route path="proveedores/:id" element={<PrivateRoute permission={PERMISOS.PROVEEDORES_VER}><ProveedorDetalle /></PrivateRoute>} />
        <Route path="usuarios" element={<PrivateRoute permission={PERMISOS.USUARIOS_GESTIONAR}><Usuarios /></PrivateRoute>} />
        <Route path="usuarios/roles-permisos" element={<PrivateRoute permission={PERMISOS.PERMISOS_ASIGNAR}><RolesPermisos /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
