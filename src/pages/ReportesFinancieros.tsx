import { useEffect, useState, useCallback } from 'react';
import { reportes, proveedores, productos, ReporteVenta, ReporteCompra, ReporteUtilidad } from '../api/client';
import { PERMISOS } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import { exportCSV, printToPDF } from '../utils/export';

type Tab = 'ventas' | 'compras' | 'utilidades';

function formatFecha(val: string): string {
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return val;
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return val;
  }
}

export default function ReportesFinancieros() {
  const { hasPermission, user } = useAuth();
  const [tab, setTab] = useState<Tab>('ventas');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [vendedorId, setVendedorId] = useState<number | ''>('');
  const [productoId, setProductoId] = useState<number | ''>('');
  const [proveedorId, setProveedorId] = useState<number | ''>('');
  const [vendedores, setVendedores] = useState<{ id: number; nombre: string; apellido?: string }[]>([]);
  const [productosList, setProductosList] = useState<{ id: number; modelo: string; marca_nombre?: string }[]>([]);
  const [proveedoresList, setProveedoresList] = useState<{ id: number; nombre: string }[]>([]);
  const [ventas, setVentas] = useState<ReporteVenta[]>([]);
  const [compras, setCompras] = useState<ReporteCompra[]>([]);
  const [utilidad, setUtilidad] = useState<ReporteUtilidad | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const esAdmin = user?.rol === 'administrador';

  useEffect(() => {
    if (!hasPermission(PERMISOS.REPORTES_VER) || !esAdmin) return;
    reportes.vendedores().then(setVendedores).catch(() => setVendedores([]));
    productos.list().then((p) => setProductosList(p)).catch(() => setProductosList([]));
    proveedores.list().then((p) => setProveedoresList(p)).catch(() => setProveedoresList([]));
  }, [hasPermission, esAdmin]);

  const cargar = useCallback(async () => {
    if (!hasPermission(PERMISOS.REPORTES_VER)) return;
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = {};
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;
      if (tab === 'ventas') {
        if (vendedorId) params.vendedor_id = vendedorId;
        if (productoId) params.producto_id = productoId;
        const data = await reportes.ventas(params);
        setVentas(Array.isArray(data) ? data : []);
      } else if (tab === 'compras') {
        if (proveedorId) params.proveedor_id = proveedorId;
        if (productoId) params.producto_id = productoId;
        const data = await reportes.compras(params);
        setCompras(Array.isArray(data) ? data : []);
      } else {
        const data = await reportes.utilidades(params);
        setUtilidad(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
      if (tab === 'ventas') setVentas([]);
      else if (tab === 'compras') setCompras([]);
      else setUtilidad(null);
    } finally {
      setLoading(false);
    }
  }, [hasPermission, tab, desde, hasta, vendedorId, productoId, proveedorId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const exportar = () => {
    if (tab === 'ventas') {
      const data = ventas.map((v) => ({
        Fecha: formatFecha(v.fecha),
        Total: v.total,
        Vendedor: v.vendedor_nombre,
        Cliente: v.cliente_nombre || '',
      }));
      exportCSV(data, `reporte-ventas-${new Date().toISOString().slice(0, 10)}`);
    } else if (tab === 'compras') {
      const data = compras.map((c) => ({
        Fecha: formatFecha(c.fecha),
        Total: c.total,
        Proveedor: c.proveedor_nombre,
        Usuario: c.usuario_nombre,
      }));
      exportCSV(data, `reporte-compras-${new Date().toISOString().slice(0, 10)}`);
    } else if (utilidad) {
      exportCSV([{
        'Ventas totales': utilidad.ventas_totales,
        'Compras totales': utilidad.compras_totales,
        Utilidad: utilidad.utilidad,
        Margen: utilidad.margen ? `${utilidad.margen}%` : '',
      }], `reporte-utilidades-${new Date().toISOString().slice(0, 10)}`);
    }
  };

  if (!hasPermission(PERMISOS.REPORTES_VER) || !esAdmin) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Reportes financieros</h1>
        <p className="text-gray-500">Solo los usuarios con rol de administrador pueden generar estos reportes.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reportes de ventas, compras y utilidades</h1>
      <p className="text-gray-600 mb-6">
        Filtre por fecha, vendedor y producto. Visualice los datos en pantalla y exporte en PDF o Excel.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div className="flex gap-2">
            {(['ventas', 'compras', 'utilidades'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {t === 'ventas' ? 'Ventas' : t === 'compras' ? 'Compras' : 'Utilidades'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Desde</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" />
            </div>
            {tab === 'ventas' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Vendedor</label>
                  <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value ? Number(e.target.value) : '')} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm min-w-[140px]">
                    <option value="">Todos</option>
                    {vendedores.map((v) => (
                      <option key={v.id} value={v.id}>{v.nombre} {v.apellido || ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Producto</label>
                  <select value={productoId} onChange={(e) => setProductoId(e.target.value ? Number(e.target.value) : '')} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm min-w-[180px]">
                    <option value="">Todos</option>
                    {productosList.map((p) => (
                      <option key={p.id} value={p.id}>{p.marca_nombre || ''} {p.modelo}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            {tab === 'compras' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Proveedor</label>
                  <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : '')} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm min-w-[160px]">
                    <option value="">Todos</option>
                    {proveedoresList.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Producto</label>
                  <select value={productoId} onChange={(e) => setProductoId(e.target.value ? Number(e.target.value) : '')} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm min-w-[180px]">
                    <option value="">Todos</option>
                    {productosList.map((p) => (
                      <option key={p.id} value={p.id}>{p.marca_nombre || ''} {p.modelo}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <button type="button" onClick={cargar} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm">
              {loading ? 'Cargando...' : 'Generar'}
            </button>
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              if (tab === 'ventas') printToPDF('Reporte de ventas', 'reporte-ventas-tabla');
              else if (tab === 'compras') printToPDF('Reporte de compras', 'reporte-compras-tabla');
              else if (tab === 'utilidades') printToPDF('Reporte de utilidades', 'reporte-utilidades');
            }}
            disabled={loading || (tab === 'ventas' && !ventas.length) || (tab === 'compras' && !compras.length) || (tab === 'utilidades' && !utilidad)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            Exportar PDF
          </button>
          <button
            type="button"
            onClick={exportar}
            disabled={loading || (tab === 'ventas' && !ventas.length) || (tab === 'compras' && !compras.length) || (tab === 'utilidades' && !utilidad)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            Exportar Excel (CSV)
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : tab === 'ventas' ? (
        <div id="reporte-ventas-tabla" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ventas.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-3 text-sm">{formatFecha(v.fecha)}</td>
                    <td className="px-4 py-3 text-sm">{v.vendedor_nombre}</td>
                    <td className="px-4 py-3 text-sm">{v.cliente_nombre || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right">${Number(v.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ventas.length === 0 && <p className="p-6 text-center text-gray-500">No hay datos de ventas.</p>}
        </div>
      ) : tab === 'compras' ? (
        <div id="reporte-compras-tabla" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {compras.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 text-sm">{formatFecha(c.fecha)}</td>
                    <td className="px-4 py-3 text-sm">{c.proveedor_nombre}</td>
                    <td className="px-4 py-3 text-sm">{c.usuario_nombre}</td>
                    <td className="px-4 py-3 text-sm text-right">${Number(c.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {compras.length === 0 && <p className="p-6 text-center text-gray-500">No hay datos de compras.</p>}
        </div>
      ) : (
        <div id="reporte-utilidades" className="bg-white rounded-lg border border-gray-200 p-6 max-w-md">
          {utilidad ? (
            <dl className="space-y-2">
              <div><dt className="text-gray-600">Ventas totales</dt><dd className="text-lg font-semibold">${Number(utilidad.ventas_totales).toLocaleString()}</dd></div>
              <div><dt className="text-gray-600">Compras totales</dt><dd className="text-lg font-semibold">${Number(utilidad.compras_totales).toLocaleString()}</dd></div>
              <div><dt className="text-gray-600">Utilidad</dt><dd className="text-lg font-semibold text-green-600">${Number(utilidad.utilidad).toLocaleString()}</dd></div>
              {utilidad.margen != null && <div><dt className="text-gray-600">Margen</dt><dd className="text-lg">{utilidad.margen}%</dd></div>}
            </dl>
          ) : (
            <p className="text-gray-500">No hay datos de utilidades.</p>
          )}
        </div>
      )}
    </div>
  );
}
