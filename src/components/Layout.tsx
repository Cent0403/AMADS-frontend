import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productos, StockBajo } from '../api/client';

const icons = {
  home: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  catalog: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  inventory: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  providers: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  reports: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  profile: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  chevron: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  menu: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

export default function Layout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stockBajo, setStockBajo] = useState<StockBajo[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [bannerExpanded, setBannerExpanded] = useState(true);
  const [stockBadgeOpen, setStockBadgeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [invDropdownOpen, setInvDropdownOpen] = useState(false);
  const [repDropdownOpen, setRepDropdownOpen] = useState(false);

  const refrescarStockBajo = () => {
    productos.stockBajo().then(setStockBajo).catch(() => setStockBajo([]));
  };

  useEffect(() => {
    refrescarStockBajo();
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => {
      refrescarStockBajo();
      setBannerDismissed(false);
    };
    window.addEventListener('stock-updated', handler);
    return () => window.removeEventListener('stock-updated', handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setInvDropdownOpen(false);
    setRepDropdownOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`;

  const canCatalog = hasPermission('catalogo_ver') || hasPermission('catalogo_editar');
  const canInventory = hasPermission('entrada_inventario');
  const canProviders = hasPermission('proveedores_ver') || hasPermission('proveedores_editar');
  const canUsers = hasPermission('usuarios_gestionar');
  const isAdmin = user?.rol === 'administrador';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-4">
              <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
                <span className="hidden sm:inline">AMADS</span>
              </NavLink>

              {/* Desktop nav */}
              <nav className="hidden lg:flex items-center gap-1">
                <NavLink to="/" end className={navLinkClass}>
                  {icons.home}
                  Inicio
                </NavLink>
                {canCatalog && (
                  <NavLink to="/catalogo" className={navLinkClass}>
                    {icons.catalog}
                    Catálogo
                  </NavLink>
                )}
                {canInventory && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setInvDropdownOpen((o) => !o)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        ['/entrada', '/salida', '/productos-danados'].some((p) => location.pathname.startsWith(p))
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {icons.inventory}
                      Inventario
                      {icons.chevron}
                    </button>
                    {invDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setInvDropdownOpen(false)} aria-hidden />
                        <div className="absolute left-0 mt-1 w-52 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                          <NavLink to="/entrada" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 text-sm ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                            Entrada
                          </NavLink>
                          <NavLink to="/salida" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 text-sm ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                            Salida
                          </NavLink>
                          <NavLink to="/productos-danados" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 text-sm ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                            Productos dañados
                          </NavLink>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {canProviders && (
                  <NavLink to="/proveedores" className={navLinkClass}>
                    {icons.providers}
                    Proveedores
                  </NavLink>
                )}
                {isAdmin && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setRepDropdownOpen((o) => !o)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        ['/reporte-inventario', '/reportes'].some((p) => location.pathname.startsWith(p))
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {icons.reports}
                      Reportes
                      {icons.chevron}
                    </button>
                    {repDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setRepDropdownOpen(false)} aria-hidden />
                        <div className="absolute left-0 mt-1 w-52 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                          <NavLink to="/reporte-inventario" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 text-sm ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                            Inventario
                          </NavLink>
                          <NavLink to="/reportes" className={({ isActive }) => `flex items-center gap-2 px-4 py-2 text-sm ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                            Financieros
                          </NavLink>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {canUsers && (
                  <NavLink to="/usuarios" className={navLinkClass}>
                    {icons.users}
                    Usuarios
                  </NavLink>
                )}
              </nav>
            </div>

            {/* User area */}
            <div className="flex items-center gap-3">
              {stockBajo.length > 0 && (
                <div className="relative hidden sm:block">
                  <button
                    type="button"
                    onClick={() => setStockBadgeOpen((o) => !o)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-sm font-medium hover:bg-amber-200 transition-colors"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
                      {stockBajo.length}
                    </span>
                    Stock bajo
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {stockBadgeOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setStockBadgeOpen(false)} aria-hidden />
                      <div className="absolute right-0 mt-1 w-72 max-h-80 overflow-y-auto py-2 bg-white rounded-xl shadow-lg border border-amber-200 z-20">
                        <div className="px-4 py-2 border-b border-amber-100">
                          <p className="text-sm font-semibold text-amber-900">{stockBajo.length} producto{stockBajo.length !== 1 ? 's' : ''} con stock bajo</p>
                          <p className="text-xs text-amber-700 mt-0.5">Stock actual ≤ mínimo definido</p>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {stockBajo.slice(0, 8).map((s) => (
                            <div key={s.id} className="px-4 py-2 hover:bg-amber-50 border-b border-amber-50 last:border-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{s.marca} {s.modelo}</p>
                              <p className="text-xs text-gray-500">Stock: {s.stock_actual} / Mín: {s.stock_minimo} · Faltan {s.faltante}</p>
                            </div>
                          ))}
                          {stockBajo.length > 8 && <p className="px-4 py-2 text-xs text-gray-500">+{stockBajo.length - 8} más</p>}
                        </div>
                        <div className="px-4 py-2 border-t border-amber-100 flex gap-2">
                          <NavLink to="/" onClick={() => setStockBadgeOpen(false)} className="flex-1 text-center py-1.5 text-sm font-medium text-amber-800 bg-amber-100 rounded-lg hover:bg-amber-200">Ver todos</NavLink>
                          {canInventory && <NavLink to="/entrada" onClick={() => setStockBadgeOpen(false)} className="flex-1 text-center py-1.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700">Registrar entrada</NavLink>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                    {(user?.nombre?.[0] || user?.email?.[0] || '?').toUpperCase()}
                  </span>
                  <span className="hidden sm:inline max-w-[120px] truncate">{user?.nombre}</span>
                  {icons.chevron}
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} aria-hidden />
                    <div className="absolute right-0 mt-1 w-56 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.nombre} {user?.apellido}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user?.rol}</p>
                      </div>
                      <NavLink to="/perfil" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        {icons.profile}
                        Mi perfil
                      </NavLink>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        {icons.logout}
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                aria-label="Menú"
              >
                {icons.menu}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              <NavLink to="/" end className={navLinkClass}>
                {icons.home}
                Inicio
              </NavLink>
              {canCatalog && (
                <NavLink to="/catalogo" className={navLinkClass}>
                  {icons.catalog}
                  Catálogo
                </NavLink>
              )}
              {canInventory && (
                <>
                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Inventario</p>
                  <NavLink to="/entrada" className={navLinkClass}>
                    Entrada
                  </NavLink>
                  <NavLink to="/salida" className={navLinkClass}>
                    Salida
                  </NavLink>
                  <NavLink to="/productos-danados" className={navLinkClass}>
                    Productos dañados
                  </NavLink>
                </>
              )}
              {canProviders && (
                <NavLink to="/proveedores" className={navLinkClass}>
                  {icons.providers}
                  Proveedores
                </NavLink>
              )}
              {isAdmin && (
                <>
                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reportes</p>
                  <NavLink to="/reporte-inventario" className={navLinkClass}>
                    {icons.reports}
                    Reporte inventario
                  </NavLink>
                  <NavLink to="/reportes" className={navLinkClass}>
                    Reportes financieros
                  </NavLink>
                </>
              )}
              {canUsers && (
                <NavLink to="/usuarios" className={navLinkClass}>
                  {icons.users}
                  Usuarios
                </NavLink>
              )}
            </nav>
          </div>
        )}
      </header>

      {stockBajo.length > 0 && !bannerDismissed && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200" role="alert">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-amber-900">
                      {stockBajo.length} producto{stockBajo.length !== 1 ? 's' : ''} con stock bajo
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-800 font-medium">
                      Requiere atención
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 mt-0.5">Stock actual igual o menor al mínimo definido. Registre entradas para reabastecer.</p>
                  {bannerExpanded && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {stockBajo.slice(0, 4).map((s) => (
                        <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/80 text-xs font-medium text-amber-900 border border-amber-200/60">
                          <span className={`inline-block w-2 h-2 rounded-full ${s.stock_actual === 0 ? 'bg-red-500' : 'bg-amber-500'}`} />
                          {s.marca} {s.modelo}: {s.stock_actual}/{s.stock_minimo}
                        </span>
                      ))}
                      {stockBajo.length > 4 && <span className="text-xs text-amber-700">+{stockBajo.length - 4} más</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setBannerExpanded((e) => !e)}
                  className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-200/60 transition-colors"
                  title={bannerExpanded ? 'Contraer' : 'Expandir'}
                >
                  <svg className={`w-4 h-4 transition-transform ${bannerExpanded ? '' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <NavLink to="/" className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors">
                  Ver detalle
                </NavLink>
                {canInventory && (
                  <NavLink to="/entrada" className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-900 transition-colors">
                    Registrar entrada
                  </NavLink>
                )}
                <button
                  type="button"
                  onClick={() => setBannerDismissed(true)}
                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-200/60 transition-colors"
                  title="Ocultar aviso"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
