import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productos, StockBajo } from '../api/client';

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
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-amber-800 mb-2">⚠️ Notificación: stock bajo</h2>
          <p className="text-sm text-amber-700 mb-3">
            Los siguientes productos tienen <strong>stock actual igual o menor al stock mínimo</strong> definido. Revise y registre entradas a tiempo.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200">
                  <th className="text-left py-2">Producto</th>
                  <th className="text-left py-2">Marca</th>
                  <th className="text-left py-2">Categoría</th>
                  <th className="text-right py-2">Stock actual</th>
                  <th className="text-right py-2">Stock mínimo</th>
                  <th className="text-right py-2">Faltante</th>
                </tr>
              </thead>
              <tbody>
                {stockBajo.map((s) => (
                  <tr key={s.id} className="border-b border-amber-100">
                    <td className="py-2">{s.modelo} {s.codigo && `(${s.codigo})`}</td>
                    <td className="py-2">{s.marca}</td>
                    <td className="py-2">{s.categoria}</td>
                    <td className="text-right py-2">{s.stock_actual}</td>
                    <td className="text-right py-2">{s.stock_minimo}</td>
                    <td className="text-right py-2 font-medium text-amber-700">{s.faltante}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(hasPermission('catalogo_ver') || hasPermission('entrada_inventario')) && (
            <div className="mt-3">
              {hasPermission('catalogo_ver') && <Link to="/catalogo" className="text-primary-600 hover:underline text-sm">Ir al catálogo</Link>}
              {hasPermission('catalogo_ver') && hasPermission('entrada_inventario') && ' · '}
              {hasPermission('entrada_inventario') && <Link to="/entrada" className="text-primary-600 hover:underline text-sm">Registrar entrada</Link>}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(hasPermission('catalogo_ver') || hasPermission('catalogo_editar')) && (
          <Link to="/catalogo" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
            <h3 className="font-semibold text-gray-900">Catálogo de llantas</h3>
            <p className="text-sm text-gray-600 mt-1">Gestionar marcas, modelos, precios y stock mínimo.</p>
          </Link>
        )}
        {hasPermission('entrada_inventario') && (
          <Link to="/entrada" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
            <h3 className="font-semibold text-gray-900">Entrada de inventario</h3>
            <p className="text-sm text-gray-600 mt-1">Registrar entrada de llantas y productos.</p>
          </Link>
        )}
        {(hasPermission('proveedores_ver') || hasPermission('proveedores_editar')) && (
          <Link to="/proveedores" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
            <h3 className="font-semibold text-gray-900">Proveedores</h3>
            <p className="text-sm text-gray-600 mt-1">Ver y administrar proveedores.</p>
          </Link>
        )}
        {hasPermission('usuarios_gestionar') && (
          <Link to="/usuarios" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
            <h3 className="font-semibold text-gray-900">Usuarios</h3>
            <p className="text-sm text-gray-600 mt-1">Crear, editar y asignar roles.</p>
          </Link>
        )}
        {hasPermission('permisos_asignar') && (
          <Link to="/usuarios/roles-permisos" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition">
            <h3 className="font-semibold text-gray-900">Roles y permisos</h3>
            <p className="text-sm text-gray-600 mt-1">Asignar permisos específicos a cada rol.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
