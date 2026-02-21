import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERMISOS } from '../constants/permissions';
import { useToast } from '../context/ToastContext';
import { productos, Producto } from '../api/client';

export default function Catalogo() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const puedeEditar = hasPermission(PERMISOS.CATALOGO_EDITAR);
  const [items, setItems] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [tipos, setTipos] = useState<{ id: number; nombre: string }[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [soloActivos, setSoloActivos] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(() => {
    setLoading(true);
    const params: { categoria_id?: number; tipo_id?: number; activo?: number } = {};
    if (filtroCategoria) params.categoria_id = Number(filtroCategoria);
    if (filtroTipo) params.tipo_id = Number(filtroTipo);
    if (soloActivos) params.activo = 1;
    productos.list(params).then(setItems).finally(() => setLoading(false));
  }, [filtroCategoria, filtroTipo, soloActivos]);

  useEffect(() => {
    productos.categorias().then(setCategorias);
    productos.tipos().then(setTipos);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const toggleActivo = async (p: Producto) => {
    try {
      await productos.update(p.id, { activo: p.activo ? 0 : 1 });
      cargar();
      showToast(p.activo ? 'Producto desactivado.' : 'Producto activado.', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de productos</h1>
        {puedeEditar && (
          <div className="flex gap-2">
            <Link to="/catalogo/marcas" className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700">
              Gestionar marcas
            </Link>
            <Link to="/catalogo/nuevo" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              Nuevo producto
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
        <span className="font-medium text-gray-700">Filtros:</span>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={soloActivos} onChange={(e) => setSoloActivos(e.target.checked)} />
          Solo activos
        </label>
        <span className="text-xs text-gray-500">
          Stock actual y mínimo por producto abajo; si actual ≤ mínimo se resalta para tomar acciones.
        </span>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código / Modelo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría / Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medida / Especs</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock actual / Mínimo</th>
                  {puedeEditar && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Activo</th>}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((p) => (
                  <tr key={p.id} className={!p.activo ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-3 text-sm">{p.codigo || '-'} / {p.modelo}</td>
                    <td className="px-4 py-3 text-sm">{p.marca_nombre}</td>
                    <td className="px-4 py-3 text-sm">{p.categoria_nombre} / {p.tipo_nombre}</td>
                    <td className="px-4 py-3 text-sm">{p.medida || '-'} {p.indice_carga && `(${p.indice_carga}/${p.indice_velocidad || ''})`} {p.color && ` · ${p.color}`}</td>
                    <td className="px-4 py-3 text-sm text-right">${Number(p.precio_venta).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right" title={p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo ? 'Stock bajo: considerar entrada' : ''}>
                      <span className={p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo ? 'text-amber-600 font-medium' : ''}>
                        {p.stock_actual}
                      </span>
                      <span className="text-gray-500"> / </span>
                      <span className={p.stock_minimo > 0 ? 'text-gray-700' : 'text-gray-400'}>{p.stock_minimo}</span>
                    </td>
                    {puedeEditar && (
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleActivo(p)}
                          className={`text-sm font-medium ${p.activo ? 'text-green-600 hover:underline' : 'text-gray-500 hover:underline'}`}
                          title={p.activo ? 'Desactivar producto (no se elimina)' : 'Activar producto'}
                        >
                          {p.activo ? 'Sí · Desactivar' : 'No · Activar'}
                        </button>
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      {puedeEditar && <Link to={`/catalogo/editar/${p.id}`} className="text-primary-600 hover:underline text-sm">Editar</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <p className="p-6 text-center text-gray-500">No hay productos con los filtros seleccionados.</p>
          )}
        </div>
      )}
    </div>
  );
}
