import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productos } from '../api/client';

export default function Layout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stockBajoCount, setStockBajoCount] = useState(0);

  const refrescarStockBajo = () => {
    productos.stockBajo().then((list) => setStockBajoCount(list.length)).catch(() => setStockBajoCount(0));
  };

  useEffect(() => {
    refrescarStockBajo();
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => refrescarStockBajo();
    window.addEventListener('stock-updated', handler);
    return () => window.removeEventListener('stock-updated', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-6">
              <NavLink to="/" className="text-xl font-bold text-primary-600">AMADS</NavLink>
              <nav className="flex gap-1">
                <NavLink to="/" end className={navClass}>Inicio</NavLink>
                {(hasPermission('catalogo_ver') || hasPermission('catalogo_editar')) && <NavLink to="/catalogo" end={false} className={navClass}>Catálogo</NavLink>}
                {hasPermission('entrada_inventario') && <NavLink to="/entrada" className={navClass}>Entrada inventario</NavLink>}
                {(hasPermission('proveedores_ver') || hasPermission('proveedores_editar')) && <NavLink to="/proveedores" className={navClass}>Proveedores</NavLink>}
                {hasPermission('usuarios_gestionar') && <NavLink to="/usuarios" className={navClass}>Usuarios</NavLink>}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.nombre} ({user?.rol})</span>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>
      {stockBajoCount > 0 && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-3 shadow-sm" role="alert">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700" aria-hidden>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Stock bajo: {stockBajoCount} producto{stockBajoCount !== 1 ? 's' : ''} con stock actual ≤ mínimo
                </p>
                <p className="text-xs text-amber-800/90 mt-0.5">Revise el inventario y registre entradas a tiempo.</p>
              </div>
            </div>
            <NavLink
              to="/"
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-200/80 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-200"
            >
              Ver en inicio
            </NavLink>
          </div>
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
