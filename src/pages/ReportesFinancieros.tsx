import { useEffect, useState, useCallback, useRef } from 'react';
import { reportes, proveedores, productos, marcas, ReporteVenta, ReporteCompra, ReporteUtilidad } from '../api/client';
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
  const [marcaId, setMarcaId] = useState<number | ''>('');
  const [proveedorId, setProveedorId] = useState<number | ''>('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [busquedaMarca, setBusquedaMarca] = useState('');
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [mostrarDropdownProducto, setMostrarDropdownProducto] = useState(false);
  const [mostrarDropdownMarca, setMostrarDropdownMarca] = useState(false);
  const [mostrarDropdownProveedor, setMostrarDropdownProveedor] = useState(false);
  const [vendedores, setVendedores] = useState<{ id: number; nombre: string; apellido?: string }[]>([]);
  const [productosList, setProductosList] = useState<{ id: number; modelo: string; marca_nombre?: string; codigo?: string }[]>([]);
  const [marcasList, setMarcasList] = useState<{ id: number; nombre: string }[]>([]);
  const [proveedoresList, setProveedoresList] = useState<{ id: number; nombre: string }[]>([]);
  const dropdownProductoRef = useRef<HTMLDivElement>(null);
  const dropdownMarcaRef = useRef<HTMLDivElement>(null);
  const dropdownProveedorRef = useRef<HTMLDivElement>(null);
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
    marcas.list(false).then((m) => setMarcasList(m)).catch(() => setMarcasList([]));
    proveedores.list().then((p) => setProveedoresList(p)).catch(() => setProveedoresList([]));
  }, [hasPermission, esAdmin]);

  const productosFiltrados = busquedaProducto.trim()
    ? productosList.filter((p) => {
        const q = busquedaProducto.trim().toLowerCase();
        const texto = [p.marca_nombre, p.modelo, p.codigo].filter(Boolean).join(' ').toLowerCase();
        return texto.includes(q);
      })
    : productosList;

  const marcasFiltradas = busquedaMarca.trim()
    ? marcasList.filter((m) => m.nombre.toLowerCase().includes(busquedaMarca.trim().toLowerCase()))
    : marcasList;

  const proveedoresFiltrados = busquedaProveedor.trim()
    ? proveedoresList.filter((p) => p.nombre.toLowerCase().includes(busquedaProveedor.trim().toLowerCase()))
    : proveedoresList;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownProductoRef.current && !dropdownProductoRef.current.contains(e.target as Node)) setMostrarDropdownProducto(false);
      if (dropdownMarcaRef.current && !dropdownMarcaRef.current.contains(e.target as Node)) setMostrarDropdownMarca(false);
      if (dropdownProveedorRef.current && !dropdownProveedorRef.current.contains(e.target as Node)) setMostrarDropdownProveedor(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        if (marcaId) params.marca_id = marcaId;
        const data = await reportes.ventas(params);
        setVentas(Array.isArray(data) ? data : []);
      } else if (tab === 'compras') {
        if (proveedorId) params.proveedor_id = proveedorId;
        if (productoId) params.producto_id = productoId;
        if (marcaId) params.marca_id = marcaId;
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
  }, [hasPermission, tab, desde, hasta, vendedorId, productoId, marcaId, proveedorId]);

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
        Filtre por fecha, vendedor, marca y producto. Visualice los datos en pantalla y exporte en PDF o Excel.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Tipo de reporte</p>
          <div className="flex gap-2">
            {(['ventas', 'compras', 'utilidades'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {t === 'ventas' ? 'Ventas' : t === 'compras' ? 'Compras' : 'Utilidades'}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Filtros</p>
          <div className="flex flex-wrap gap-x-6 gap-y-4 items-center">
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm w-[140px]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm w-[140px]" />
              </div>
            </div>
            {tab === 'ventas' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Vendedor</label>
                  <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value ? Number(e.target.value) : '')} className="border border-gray-300 rounded-md px-3 py-2 text-sm w-[160px]">
                    <option value="">Todos</option>
                    {vendedores.map((v) => (
                      <option key={v.id} value={v.id}>{v.nombre} {v.apellido || ''}</option>
                    ))}
                  </select>
                </div>
                <div ref={dropdownMarcaRef} className="relative w-[180px]">
                  <label className="block text-xs text-gray-500 mb-1">Marca</label>
                  <input
                    type="text"
                    value={busquedaMarca}
                    onChange={(e) => {
                      setBusquedaMarca(e.target.value);
                      setMostrarDropdownMarca(true);
                      if (!e.target.value) setMarcaId('');
                    }}
                    onFocus={() => marcasList.length > 0 && setMostrarDropdownMarca(true)}
                    placeholder="Buscar marca..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  {mostrarDropdownMarca && marcasFiltradas.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
                      <li
                        role="option"
                        onClick={() => { setMarcaId(''); setBusquedaMarca(''); setMostrarDropdownMarca(false); }}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50"
                      >
                        Todos
                      </li>
                      {marcasFiltradas.map((m) => (
                        <li
                          key={m.id}
                          role="option"
                          aria-selected={marcaId === m.id}
                          onClick={() => { setMarcaId(m.id); setBusquedaMarca(m.nombre); setMostrarDropdownMarca(false); }}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${marcaId === m.id ? 'bg-primary-50 text-primary-700' : ''}`}
                        >
                          {m.nombre}
                        </li>
                      ))}
                    </ul>
                  )}
                  {mostrarDropdownMarca && busquedaMarca.trim() && marcasFiltradas.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full px-3 py-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-md shadow-lg">
                      No hay marcas que coincidan.
                    </div>
                  )}
                </div>
                <div ref={dropdownProductoRef} className="relative w-[240px]">
                  <label className="block text-xs text-gray-500 mb-1">Producto</label>
                  <input
                    type="text"
                    value={busquedaProducto}
                    onChange={(e) => {
                      setBusquedaProducto(e.target.value);
                      setMostrarDropdownProducto(true);
                      if (!e.target.value) setProductoId('');
                    }}
                    onFocus={() => productosList.length > 0 && setMostrarDropdownProducto(true)}
                    placeholder="Buscar por marca, modelo o código..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  {mostrarDropdownProducto && productosFiltrados.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
                      <li
                        role="option"
                        onClick={() => { setProductoId(''); setBusquedaProducto(''); setMostrarDropdownProducto(false); }}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50"
                      >
                        Todos
                      </li>
                      {productosFiltrados.map((p) => (
                        <li
                          key={p.id}
                          role="option"
                          aria-selected={productoId === p.id}
                          onClick={() => { setProductoId(p.id); setBusquedaProducto(`${p.marca_nombre || ''} ${p.modelo}`.trim()); setMostrarDropdownProducto(false); }}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${productoId === p.id ? 'bg-primary-50 text-primary-700' : ''}`}
                        >
                          {p.marca_nombre || ''} {p.modelo}{p.codigo ? ` - ${p.codigo}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                  {mostrarDropdownProducto && busquedaProducto.trim() && productosFiltrados.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full px-3 py-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-md shadow-lg">
                      No hay productos que coincidan.
                    </div>
                  )}
                </div>
              </>
            )}
            {tab === 'compras' && (
              <>
                <div ref={dropdownProveedorRef} className="relative w-[200px]">
                  <label className="block text-xs text-gray-500 mb-1">Proveedor</label>
                  <input
                    type="text"
                    value={busquedaProveedor}
                    onChange={(e) => {
                      setBusquedaProveedor(e.target.value);
                      setMostrarDropdownProveedor(true);
                      if (!e.target.value) setProveedorId('');
                    }}
                    onFocus={() => proveedoresList.length > 0 && setMostrarDropdownProveedor(true)}
                    placeholder="Buscar proveedor..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  {mostrarDropdownProveedor && proveedoresFiltrados.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
                      <li
                        role="option"
                        onClick={() => { setProveedorId(''); setBusquedaProveedor(''); setMostrarDropdownProveedor(false); }}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50"
                      >
                        Todos
                      </li>
                      {proveedoresFiltrados.map((p) => (
                        <li
                          key={p.id}
                          role="option"
                          aria-selected={proveedorId === p.id}
                          onClick={() => { setProveedorId(p.id); setBusquedaProveedor(p.nombre); setMostrarDropdownProveedor(false); }}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${proveedorId === p.id ? 'bg-primary-50 text-primary-700' : ''}`}
                        >
                          {p.nombre}
                        </li>
                      ))}
                    </ul>
                  )}
                  {mostrarDropdownProveedor && busquedaProveedor.trim() && proveedoresFiltrados.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full px-3 py-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-md shadow-lg">
                      No hay proveedores que coincidan.
                    </div>
                  )}
                </div>
                <div ref={dropdownMarcaRef} className="relative w-[180px]">
                  <label className="block text-xs text-gray-500 mb-1">Marca</label>
                  <input
                    type="text"
                    value={busquedaMarca}
                    onChange={(e) => {
                      setBusquedaMarca(e.target.value);
                      setMostrarDropdownMarca(true);
                      if (!e.target.value) setMarcaId('');
                    }}
                    onFocus={() => marcasList.length > 0 && setMostrarDropdownMarca(true)}
                    placeholder="Buscar marca..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  {mostrarDropdownMarca && marcasFiltradas.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
                      <li
                        role="option"
                        onClick={() => { setMarcaId(''); setBusquedaMarca(''); setMostrarDropdownMarca(false); }}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50"
                      >
                        Todos
                      </li>
                      {marcasFiltradas.map((m) => (
                        <li
                          key={m.id}
                          role="option"
                          aria-selected={marcaId === m.id}
                          onClick={() => { setMarcaId(m.id); setBusquedaMarca(m.nombre); setMostrarDropdownMarca(false); }}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${marcaId === m.id ? 'bg-primary-50 text-primary-700' : ''}`}
                        >
                          {m.nombre}
                        </li>
                      ))}
                    </ul>
                  )}
                  {mostrarDropdownMarca && busquedaMarca.trim() && marcasFiltradas.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full px-3 py-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-md shadow-lg">
                      No hay marcas que coincidan.
                    </div>
                  )}
                </div>
                <div ref={dropdownProductoRef} className="relative w-[240px]">
                  <label className="block text-xs text-gray-500 mb-1">Producto</label>
                  <input
                    type="text"
                    value={busquedaProducto}
                    onChange={(e) => {
                      setBusquedaProducto(e.target.value);
                      setMostrarDropdownProducto(true);
                      if (!e.target.value) setProductoId('');
                    }}
                    onFocus={() => productosList.length > 0 && setMostrarDropdownProducto(true)}
                    placeholder="Buscar por marca, modelo o código..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  {mostrarDropdownProducto && productosFiltrados.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
                      <li
                        role="option"
                        onClick={() => { setProductoId(''); setBusquedaProducto(''); setMostrarDropdownProducto(false); }}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50"
                      >
                        Todos
                      </li>
                      {productosFiltrados.map((p) => (
                        <li
                          key={p.id}
                          role="option"
                          aria-selected={productoId === p.id}
                          onClick={() => { setProductoId(p.id); setBusquedaProducto(`${p.marca_nombre || ''} ${p.modelo}`.trim()); setMostrarDropdownProducto(false); }}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${productoId === p.id ? 'bg-primary-50 text-primary-700' : ''}`}
                        >
                          {p.marca_nombre || ''} {p.modelo}{p.codigo ? ` - ${p.codigo}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                  {mostrarDropdownProducto && busquedaProducto.trim() && productosFiltrados.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full px-3 py-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-md shadow-lg">
                      No hay productos que coincidan.
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="self-center">
              <button type="button" onClick={cargar} disabled={loading} className="px-5 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm font-medium">
                {loading ? 'Cargando...' : 'Generar'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-gray-100">
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
