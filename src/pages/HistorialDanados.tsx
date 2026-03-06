import { useEffect, useMemo, useRef, useState } from 'react';
import { productos, reportes, Producto, ProductoDanado } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { PERMISOS } from '../constants/permissions';
import { Link } from 'react-router-dom';
import { exportCSV } from '../utils/export';

export default function HistorialDanados() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const [historial, setHistorial] = useState<ProductoDanado[]>([]);
  const [allProductos, setAllProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [productoId, setProductoId] = useState<number | ''>('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarDropdownProducto, setMostrarDropdownProducto] = useState(false);
  const [busquedaTabla, setBusquedaTabla] = useState('');
  
  const dropdownProductoRef = useRef<HTMLDivElement>(null);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const params: { desde?: string; hasta?: string; producto_id?: number } = {};
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;
      if (productoId) params.producto_id = Number(productoId);
      
      const data = await reportes.danados(params);
      setHistorial(data);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al cargar historial.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
    productos.list().then(setAllProductos).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownProductoRef.current && !dropdownProductoRef.current.contains(e.target as Node)) setMostrarDropdownProducto(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const productosFiltrados = useMemo(() => {
    const q = busquedaProducto.trim().toLowerCase();
    if (!q) return allProductos;
    return allProductos.filter((p) => {
      const texto = [p.categoria_nombre, p.tipo_nombre, p.marca_nombre, p.modelo, p.medida, p.color, p.codigo]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return texto.includes(q);
    });
  }, [allProductos, busquedaProducto]);

  const itemsFiltrados = useMemo(() => {
    const q = busquedaTabla.trim().toLowerCase();
    if (!q) return historial;
    return historial.filter((item) => {
      const texto = [
        item.producto_nombre,
        item.marca_nombre,
        item.modelo,
        item.categoria_nombre,
        item.motivo,
        item.usuario_nombre,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return texto.includes(q);
    });
  }, [historial, busquedaTabla]);

  const limpiarFiltros = () => {
    setDesde('');
    setHasta('');
    setProductoId('');
    setBusquedaProducto('');
    setBusquedaTabla('');
    cargarHistorial();
  };

  const handleExportar = () => {
    if (itemsFiltrados.length === 0) {
      showToast('No hay datos para exportar.', 'error');
      return;
    }
    
    const datos = itemsFiltrados.map((item) => ({
      Fecha: new Date(item.fecha).toLocaleDateString('es-GT'),
      Producto: item.producto_nombre,
      Marca: item.marca_nombre,
      Modelo: item.modelo,
      Categoría: item.categoria_nombre,
      Cantidad: item.cantidad,
      Motivo: item.motivo || '',
      'Reportado por': item.usuario_nombre,
    }));
    
    exportCSV(datos, 'historial_productos_danados');
    showToast('Historial exportado exitosamente.', 'success');
  };

  if (!hasPermission(PERMISOS.ENTRADA_INVENTARIO)) {
    return <p className="text-gray-500">No tiene permisos para ver el historial de productos dañados.</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historial de productos dañados</h1>
        <Link
          to="/productos-danados"
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Reportar nuevo
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
            <div ref={dropdownProductoRef} className="relative">
              <input
                type="search"
                value={busquedaProducto}
                onChange={(e) => {
                  setBusquedaProducto(e.target.value);
                  setMostrarDropdownProducto(true);
                  if (!e.target.value) setProductoId('');
                }}
                onFocus={() => setMostrarDropdownProducto(true)}
                placeholder="Buscar producto..."
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              {mostrarDropdownProducto && (
                <ul className="absolute z-10 mt-1 w-full max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
                  {productosFiltrados.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-gray-500">No hay productos que coincidan.</li>
                  ) : (
                    productosFiltrados.map((p) => (
                      <li
                        key={p.id}
                        role="option"
                        aria-selected={productoId === p.id}
                        onClick={() => {
                          setProductoId(p.id);
                          setBusquedaProducto(`${p.marca_nombre} ${p.modelo}${p.medida ? ` (${p.medida})` : ''}`);
                          setMostrarDropdownProducto(false);
                        }}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${productoId === p.id ? 'bg-primary-50 text-primary-700' : ''}`}
                      >
                        {p.marca_nombre} {p.modelo} {p.medida ? `(${p.medida})` : ''}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={cargarHistorial}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Aplicar filtros
          </button>
          <button
            onClick={limpiarFiltros}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Búsqueda y exportar */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="search"
          placeholder="Buscar en resultados..."
          value={busquedaTabla}
          onChange={(e) => setBusquedaTabla(e.target.value)}
          className="max-w-md border border-gray-300 rounded-md px-3 py-2"
        />
        <button
          onClick={handleExportar}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Exportar a CSV
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando historial...</div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron registros de productos dañados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca / Modelo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reportado por</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itemsFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.fecha).toLocaleDateString('es-GT', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.producto_nombre}
                      {item.producto_codigo && (
                        <span className="text-gray-500 text-xs block">{item.producto_codigo}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.marca_nombre} {item.modelo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.categoria_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      -{item.cantidad}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.motivo || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.usuario_nombre}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumen */}
      {itemsFiltrados.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{itemsFiltrados.length}</span> registro(s) encontrado(s)
            </p>
            <p className="text-sm text-gray-600">
              Total unidades dañadas:{' '}
              <span className="font-medium text-red-600">
                {itemsFiltrados.reduce((sum, item) => sum + item.cantidad, 0)}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
