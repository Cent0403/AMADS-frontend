import { useEffect, useState, useCallback } from 'react';
import { productos, proveedores, marcas, Producto, Proveedor } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { exportCSV, printToPDF } from '../utils/export';

export default function ReporteInventario() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [tipos, setTipos] = useState<{ id: number; nombre: string }[]>([]);
  const [marcas, setMarcas] = useState<{ id: number; nombre: string; activo: number }[]>([]);
  const [proveedoresList, setProveedoresList] = useState<Proveedor[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroMarca, setFiltroMarca] = useState<string>('');
  const [filtroProveedor, setFiltroProveedor] = useState<string>('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params: { categoria_id?: number; tipo_id?: number; marca_id?: number } = {};
      if (filtroCategoria) params.categoria_id = Number(filtroCategoria);
      if (filtroTipo) params.tipo_id = Number(filtroTipo);
      if (filtroMarca) params.marca_id = Number(filtroMarca);
      const lista = await productos.list(params);
      let filtrada = lista;

      if (filtroProveedor) {
        try {
          const prods = await proveedores.productos(Number(filtroProveedor));
          const ids = new Set(prods.map((p) => p.id));
          filtrada = lista.filter((p) => ids.has(p.id));
        } catch {
          filtrada = [];
        }
      }
      setItems(filtrada);
      setUltimaActualizacion(new Date());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filtroCategoria, filtroTipo, filtroMarca, filtroProveedor]);

  useEffect(() => {
    productos.categorias().then(setCategorias);
    productos.tipos().then(setTipos);
    marcas.list(false).then(setMarcas);
    proveedores.list().then(setProveedoresList);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const exportarExcel = () => {
    const data = items.map((p) => ({
      Código: p.codigo || '',
      Modelo: p.modelo,
      Marca: p.marca_nombre,
      Categoría: p.categoria_nombre,
      Tipo: p.tipo_nombre,
      Medida: p.medida || '',
      'Stock actual': p.stock_actual,
      'Stock mínimo': p.stock_minimo,
      'Stock bajo': p.stock_actual <= p.stock_minimo ? 'Sí' : 'No',
      Precio: p.precio_venta,
    }));
    exportCSV(data, `reporte-inventario-${new Date().toISOString().slice(0, 10)}`);
  };

  const exportarPDF = () => {
    printToPDF('Reporte de inventario', 'reporte-inventario-tabla');
  };

  if (!isAdmin) {
    return <p className="text-gray-500">Solo administradores pueden ver este reporte.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reporte de inventario</h1>
      <p className="text-gray-600 mb-6">
        Visualice el inventario por categoría, marca, medida y proveedor. Filtre por los criterios que necesite y exporte en PDF o Excel.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
        <span className="font-medium text-gray-700">Filtros:</span>
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select value={filtroMarca} onChange={(e) => setFiltroMarca(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
          <option value="">Todas las marcas</option>
          {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
          <option value="">Todos los tipos</option>
          {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
        <select value={filtroProveedor} onChange={(e) => setFiltroProveedor(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
          <option value="">Todos los proveedores</option>
          {proveedoresList.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <button type="button" onClick={cargar} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm">
          {loading ? 'Cargando...' : 'Actualizar reporte'}
        </button>
        {ultimaActualizacion && (
          <span className="text-xs text-gray-500">
            Última actualización: {ultimaActualizacion.toLocaleString('es')}
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button type="button" onClick={exportarExcel} disabled={items.length === 0} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50">
          Exportar Excel (CSV)
        </button>
        <button type="button" onClick={exportarPDF} disabled={items.length === 0} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50">
          Exportar PDF
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div id="reporte-inventario-tabla" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código / Modelo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría / Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medida</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock actual</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock mínimo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Alerta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((p) => {
                  const bajo = p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo;
                  return (
                    <tr key={p.id} className={bajo ? 'bg-amber-50' : ''}>
                      <td className="px-4 py-3 text-sm">{p.codigo || '-'} / {p.modelo}</td>
                      <td className="px-4 py-3 text-sm">{p.marca_nombre}</td>
                      <td className="px-4 py-3 text-sm">{p.categoria_nombre} / {p.tipo_nombre}</td>
                      <td className="px-4 py-3 text-sm">{p.medida || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right">{p.stock_actual}</td>
                      <td className="px-4 py-3 text-sm text-right">{p.stock_minimo}</td>
                      <td className="px-4 py-3 text-center">
                        {bajo && (
                          <span className="inline-flex items-center text-amber-600" title="Stock bajo">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
