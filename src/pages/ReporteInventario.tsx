import { useEffect, useState, useCallback, useRef } from 'react';
import { productos, proveedores, Producto, Proveedor } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PERMISOS } from '../constants/permissions';
import { exportCSV, printToPDF } from '../utils/export';

export default function ReporteInventario() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [tipos, setTipos] = useState<{ id: number; nombre: string }[]>([]);
  const [marcasList, setMarcasList] = useState<{ id: number; nombre: string; activo: number }[]>([]);
  const [proveedoresList, setProveedoresList] = useState<Proveedor[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroMarca, setFiltroMarca] = useState<string>('');
  const [filtroProveedor, setFiltroProveedor] = useState<string>('');
  const [busquedaCategoria, setBusquedaCategoria] = useState('');
  const [busquedaTipo, setBusquedaTipo] = useState('');
  const [busquedaMarca, setBusquedaMarca] = useState('');
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [mostrarDropdownCategoria, setMostrarDropdownCategoria] = useState(false);
  const [mostrarDropdownTipo, setMostrarDropdownTipo] = useState(false);
  const [mostrarDropdownMarca, setMostrarDropdownMarca] = useState(false);
  const [mostrarDropdownProveedor, setMostrarDropdownProveedor] = useState(false);
  const dropdownCategoriaRef = useRef<HTMLDivElement>(null);
  const dropdownTipoRef = useRef<HTMLDivElement>(null);
  const dropdownMarcaRef = useRef<HTMLDivElement>(null);
  const dropdownProveedorRef = useRef<HTMLDivElement>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const mapMarcasDesdeProductos = useCallback((lista: Producto[]) => {
    const marcasMap = new Map<number, { id: number; nombre: string; activo: number }>();
    lista.forEach((p) => {
      if (!marcasMap.has(p.marca_id)) {
        marcasMap.set(p.marca_id, { id: p.marca_id, nombre: p.marca_nombre, activo: 1 });
      }
    });
    return Array.from(marcasMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, []);

  const categoriasFiltradas = busquedaCategoria.trim()
    ? categorias.filter((c) => c.nombre.toLowerCase().includes(busquedaCategoria.trim().toLowerCase()))
    : categorias;

  const tiposFiltrados = busquedaTipo.trim()
    ? tipos.filter((t) => t.nombre.toLowerCase().includes(busquedaTipo.trim().toLowerCase()))
    : tipos;

  const marcasFiltradas = busquedaMarca.trim()
    ? marcasList.filter((m) => m.nombre.toLowerCase().includes(busquedaMarca.trim().toLowerCase()))
    : marcasList;

  const proveedoresFiltrados = busquedaProveedor.trim()
    ? proveedoresList.filter((p) => p.nombre.toLowerCase().includes(busquedaProveedor.trim().toLowerCase()))
    : proveedoresList;

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
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownCategoriaRef.current && !dropdownCategoriaRef.current.contains(e.target as Node)) setMostrarDropdownCategoria(false);
      if (dropdownTipoRef.current && !dropdownTipoRef.current.contains(e.target as Node)) setMostrarDropdownTipo(false);
      if (dropdownMarcaRef.current && !dropdownMarcaRef.current.contains(e.target as Node)) setMostrarDropdownMarca(false);
      if (dropdownProveedorRef.current && !dropdownProveedorRef.current.contains(e.target as Node)) setMostrarDropdownProveedor(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    productos.categorias().then(setCategorias).catch(() => setCategorias([]));
    productos.tipos().then(setTipos).catch(() => setTipos([]));
    productos.list().then((lista) => setMarcasList(mapMarcasDesdeProductos(lista))).catch(() => setMarcasList([]));
    proveedores.list().then(setProveedoresList).catch(() => setProveedoresList([]));
  }, [mapMarcasDesdeProductos]);

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

  if (!hasPermission(PERMISOS.REPORTES_VER)) {
    return <p className="text-gray-500">No tiene permisos para ver este reporte.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reporte de inventario</h1>
      <p className="text-gray-600 mb-6">
        Visualice el inventario por categoría, marca, medida y proveedor. Filtre por los criterios que necesite y exporte en PDF o Excel.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
        <span className="font-medium text-gray-700">Filtros:</span>
        <div ref={dropdownCategoriaRef} className="relative">
          <input
            type="text"
            value={busquedaCategoria}
            onChange={(e) => {
              setBusquedaCategoria(e.target.value);
              setMostrarDropdownCategoria(true);
              if (!e.target.value) setFiltroCategoria('');
            }}
            onFocus={() => categorias.length > 0 && setMostrarDropdownCategoria(true)}
            placeholder="Todas las categorías"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-[180px]"
          />
          {mostrarDropdownCategoria && categoriasFiltradas.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
              <li
                role="option"
                onClick={() => { setFiltroCategoria(''); setBusquedaCategoria(''); setMostrarDropdownCategoria(false); }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50"
              >
                Todas las categorías
              </li>
              {categoriasFiltradas.map((c) => (
                <li
                  key={c.id}
                  role="option"
                  aria-selected={filtroCategoria === String(c.id)}
                  onClick={() => { setFiltroCategoria(String(c.id)); setBusquedaCategoria(c.nombre); setMostrarDropdownCategoria(false); }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${filtroCategoria === String(c.id) ? 'bg-primary-50 text-primary-700' : ''}`}
                >
                  {c.nombre}
                </li>
              ))}
            </ul>
          )}
          {mostrarDropdownCategoria && busquedaCategoria.trim() && categoriasFiltradas.length === 0 && (
            <div className="absolute z-10 mt-1 w-full px-3 py-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-md shadow-lg">
              No hay categorías que coincidan.
            </div>
          )}
        </div>
        <div ref={dropdownMarcaRef} className="relative">
          <input
            type="text"
            value={busquedaMarca}
            onChange={(e) => {
              setBusquedaMarca(e.target.value);
              setMostrarDropdownMarca(true);
              if (!e.target.value) setFiltroMarca('');
            }}
            onFocus={() => marcasList.length > 0 && setMostrarDropdownMarca(true)}
            placeholder="Todas las marcas"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-[180px]"
          />
          {mostrarDropdownMarca && marcasFiltradas.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
              <li
                role="option"
                onClick={() => { setFiltroMarca(''); setBusquedaMarca(''); setMostrarDropdownMarca(false); }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50"
              >
                Todas las marcas
              </li>
              {marcasFiltradas.map((m) => (
                <li
                  key={m.id}
                  role="option"
                  aria-selected={filtroMarca === String(m.id)}
                  onClick={() => { setFiltroMarca(String(m.id)); setBusquedaMarca(m.nombre); setMostrarDropdownMarca(false); }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${filtroMarca === String(m.id) ? 'bg-primary-50 text-primary-700' : ''}`}
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
        <div ref={dropdownTipoRef} className="relative">
          <input
            type="text"
            value={busquedaTipo}
            onChange={(e) => {
              setBusquedaTipo(e.target.value);
              setMostrarDropdownTipo(true);
              if (!e.target.value) setFiltroTipo('');
            }}
            onFocus={() => tipos.length > 0 && setMostrarDropdownTipo(true)}
            placeholder="Todos los tipos"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-[180px]"
          />
          {mostrarDropdownTipo && tiposFiltrados.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
              <li
                role="option"
                onClick={() => { setFiltroTipo(''); setBusquedaTipo(''); setMostrarDropdownTipo(false); }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50"
              >
                Todos los tipos
              </li>
              {tiposFiltrados.map((t) => (
                <li
                  key={t.id}
                  role="option"
                  aria-selected={filtroTipo === String(t.id)}
                  onClick={() => { setFiltroTipo(String(t.id)); setBusquedaTipo(t.nombre); setMostrarDropdownTipo(false); }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${filtroTipo === String(t.id) ? 'bg-primary-50 text-primary-700' : ''}`}
                >
                  {t.nombre}
                </li>
              ))}
            </ul>
          )}
          {mostrarDropdownTipo && busquedaTipo.trim() && tiposFiltrados.length === 0 && (
            <div className="absolute z-10 mt-1 w-full px-3 py-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-md shadow-lg">
              No hay tipos que coincidan.
            </div>
          )}
        </div>
        <div ref={dropdownProveedorRef} className="relative">
          <input
            type="text"
            value={busquedaProveedor}
            onChange={(e) => {
              setBusquedaProveedor(e.target.value);
              setMostrarDropdownProveedor(true);
              if (!e.target.value) setFiltroProveedor('');
            }}
            onFocus={() => proveedoresList.length > 0 && setMostrarDropdownProveedor(true)}
            placeholder="Todos los proveedores"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-[180px]"
          />
          {mostrarDropdownProveedor && proveedoresFiltrados.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
              <li
                role="option"
                onClick={() => { setFiltroProveedor(''); setBusquedaProveedor(''); setMostrarDropdownProveedor(false); }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50"
              >
                Todos los proveedores
              </li>
              {proveedoresFiltrados.map((p) => (
                <li
                  key={p.id}
                  role="option"
                  aria-selected={filtroProveedor === String(p.id)}
                  onClick={() => { setFiltroProveedor(String(p.id)); setBusquedaProveedor(p.nombre); setMostrarDropdownProveedor(false); }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${filtroProveedor === String(p.id) ? 'bg-primary-50 text-primary-700' : ''}`}
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
