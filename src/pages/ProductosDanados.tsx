import { useEffect, useMemo, useRef, useState } from 'react';
import { productos, Producto } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { PERMISOS } from '../constants/permissions';
import { Link } from 'react-router-dom';

export default function ProductosDanados() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const [allProductos, setAllProductos] = useState<Producto[]>([]);
  const [productoId, setProductoId] = useState<number | ''>('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarDropdownProducto, setMostrarDropdownProducto] = useState(false);
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const dropdownProductoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    productos.list({ activo: 1 }).then(setAllProductos);
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

  const producto = allProductos.find((p) => p.id === Number(productoId));
  const stockDisponible = producto?.stock_actual ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoId || !cantidad || cantidad <= 0) {
      showToast('Seleccione un producto e ingrese una cantidad mayor a cero.', 'error');
      return;
    }
    if (cantidad > stockDisponible) {
      showToast(`La cantidad no puede superar el stock disponible (${stockDisponible}).`, 'error');
      return;
    }
    setLoading(true);
    try {
      await productos.reportarDanado({
        producto_id: Number(productoId),
        cantidad: Number(cantidad),
        motivo: motivo || undefined,
      });
      showToast('Producto dañado registrado. El inventario se actualizó.', 'success');
      setCantidad('');
      setMotivo('');
      setProductoId('');
      setBusquedaProducto('');
      productos.list({ activo: 1 }).then(setAllProductos);
      window.dispatchEvent(new CustomEvent('stock-updated'));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al registrar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission(PERMISOS.ENTRADA_INVENTARIO)) {
    return <p className="text-gray-500">No tiene permisos para reportar productos dañados.</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportar productos dañados o defectuosos</h1>
        <Link
          to="/historial-danados"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Ver historial
        </Link>
      </div>
      <p className="text-gray-600 mb-6">
        Registre productos dañados o defectuosos. El sistema descontará automáticamente la cantidad del inventario y guardará un registro con fecha y responsable.
      </p>

      <form onSubmit={handleSubmit} className="max-w-xl bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
          <div ref={dropdownProductoRef} className="relative">
            <input
              type="search"
              value={busquedaProducto}
              onChange={(e) => {
                setBusquedaProducto(e.target.value);
                setMostrarDropdownProducto(true);
                setProductoId('');
              }}
              onFocus={() => setMostrarDropdownProducto(true)}
              placeholder="Seleccionar producto"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
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
                      {p.marca_nombre} {p.modelo} {p.medida ? `(${p.medida})` : ''} {' — Stock: '}{p.stock_actual}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad dañada * (máx. {stockDisponible})</label>
          <input
            type="number"
            min="1"
            max={stockDisponible}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value ? parseInt(e.target.value, 10) : '')}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
          <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="ej. Defecto de fábrica, daño en transporte" required />
        </div>
        <button type="submit" disabled={loading || (productoId && cantidad > 0 && Number(cantidad) > stockDisponible)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
          {loading ? 'Registrando...' : 'Registrar producto dañado'}
        </button>
      </form>

      {producto && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-xl">
          <h3 className="font-medium text-gray-900 mb-2">Resumen</h3>
          <p><span className="text-gray-600">Producto:</span> {producto.marca_nombre} {producto.modelo}{producto.medida ? ` (${producto.medida})` : ''}</p>
          <p><span className="text-gray-600">Stock actual:</span> <strong>{producto.stock_actual}</strong></p>
          <p><span className="text-gray-600">Cantidad a descontar:</span> <strong>{cantidad || '-'}</strong></p>
        </div>
      )}
    </div>
  );
}
