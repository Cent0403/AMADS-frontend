import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productos, StockBajo } from '../api/client';
import { PERMISOS } from '../constants/permissions';

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [stockBajo, setStockBajo] = useState<StockBajo[]>([]);

  useEffect(() => {
    productos.stockBajo().then(setStockBajo).catch(() => setStockBajo([]));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bienvenido, {user?.nombre}</h1>

      {stockBajo.length > 0 && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-amber-200/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200 text-amber-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </span>
              <div>
                <h2 className="text-lg font-semibold text-amber-900">Productos con stock bajo</h2>
                <p className="text-sm text-amber-700">Stock actual ≤ mínimo definido. Registre entradas para reabastecer.</p>
              </div>
            </div>
            <div className="flex gap-2">
              {hasPermission(PERMISOS.CATALOGO_VER) && <Link to="/catalogo" className="px-3 py-1.5 text-sm font-medium text-amber-800 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors">Ir al catálogo</Link>}
              {hasPermission(PERMISOS.ENTRADA_INVENTARIO) && <Link to="/entrada" className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors">Registrar entrada</Link>}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-amber-100/50">
                  <th className="text-left py-3 px-4 font-semibold text-amber-900">Producto</th>
                  <th className="text-left py-3 px-4 font-semibold text-amber-900">Marca</th>
                  <th className="text-left py-3 px-4 font-semibold text-amber-900">Categoría</th>
                  <th className="text-right py-3 px-4 font-semibold text-amber-900">Stock actual</th>
                  <th className="text-right py-3 px-4 font-semibold text-amber-900">Mínimo</th>
                  <th className="text-right py-3 px-4 font-semibold text-amber-900">Faltante</th>
                  <th className="text-center py-3 px-4 font-semibold text-amber-900">Estado</th>
                </tr>
              </thead>
              <tbody>
                {stockBajo.map((s) => {
                  const critico = s.stock_actual === 0;
                  return (
                    <tr key={s.id} className={`border-b border-amber-100/80 hover:bg-amber-50/50 transition-colors ${critico ? 'bg-red-50/30' : ''}`}>
                      <td className="py-3 px-4 font-medium text-gray-900">{s.modelo} {s.codigo && <span className="text-gray-500">({s.codigo})</span>}</td>
                      <td className="py-3 px-4 text-gray-700">{s.marca}</td>
                      <td className="py-3 px-4 text-gray-600">{s.categoria}</td>
                      <td className="py-3 px-4 text-right font-medium">{s.stock_actual}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{s.stock_minimo}</td>
                      <td className="py-3 px-4 text-right font-semibold text-amber-700">{s.faltante}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${critico ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${critico ? 'bg-red-500' : 'bg-amber-500'}`} />
                          {critico ? 'Agotado' : 'Bajo'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(hasPermission(PERMISOS.CATALOGO_VER) || hasPermission(PERMISOS.CATALOGO_EDITAR)) && (
          <Link to="/catalogo" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
            <h3 className="font-semibold text-gray-900">Catálogo de llantas</h3>
            <p className="text-sm text-gray-600 mt-1">Gestionar marcas, modelos, precios y stock mínimo.</p>
          </Link>
        )}
        {hasPermission(PERMISOS.ENTRADA_INVENTARIO) && (
          <Link to="/entrada" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
            <h3 className="font-semibold text-gray-900">Entrada de inventario</h3>
            <p className="text-sm text-gray-600 mt-1">Registrar entrada de llantas y productos.</p>
          </Link>
        )}
        {(hasPermission(PERMISOS.PROVEEDORES_VER) || hasPermission(PERMISOS.PROVEEDORES_EDITAR)) && (
          <Link to="/proveedores" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
            <h3 className="font-semibold text-gray-900">Proveedores</h3>
            <p className="text-sm text-gray-600 mt-1">Ver y administrar proveedores.</p>
          </Link>
        )}
        {hasPermission(PERMISOS.USUARIOS_GESTIONAR) && (
          <Link to="/usuarios" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
            <h3 className="font-semibold text-gray-900">Usuarios</h3>
            <p className="text-sm text-gray-600 mt-1">Crear, editar y asignar roles.</p>
          </Link>
        )}
        {hasPermission(PERMISOS.PERMISOS_ASIGNAR) && (
          <Link to="/usuarios/roles-permisos" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
            <h3 className="font-semibold text-gray-900">Roles y permisos</h3>
            <p className="text-sm text-gray-600 mt-1">Asignar permisos específicos a cada rol.</p>
          </Link>
        )}
        {hasPermission(PERMISOS.REPORTES_VER) && (
          <>
            <Link to="/reporte-inventario" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900">Reporte de inventario</h3>
              <p className="text-sm text-gray-600 mt-1">Ver existencias, filtros y exportar.</p>
            </Link>
            <Link to="/reportes" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900">Reportes financieros</h3>
              <p className="text-sm text-gray-600 mt-1">Ventas, compras y utilidades.</p>
            </Link>
          </>
        )}
        {hasPermission(PERMISOS.ENTRADA_INVENTARIO) && (
          <Link to="/salida" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
            <h3 className="font-semibold text-gray-900">Salida de inventario</h3>
            <p className="text-sm text-gray-600 mt-1">Registrar salida por venta.</p>
          </Link>
        )}
        {hasPermission(PERMISOS.ENTRADA_INVENTARIO) && (
          <Link to="/productos-danados" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
            <h3 className="font-semibold text-gray-900">Productos dañados</h3>
            <p className="text-sm text-gray-600 mt-1">Reportar defectuosos o dañados.</p>
          </Link>
        )}
        <Link to="/perfil" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
          <h3 className="font-semibold text-gray-900">Mi perfil</h3>
          <p className="text-sm text-gray-600 mt-1">Actualizar datos de contacto.</p>
        </Link>
      </div>
    </div>
  );
}
