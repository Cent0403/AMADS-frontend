import { useEffect, useState, useMemo } from 'react';
import { productos, Producto } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function SalidaInventario() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const [allProductos, setAllProductos] = useState<Producto[]>([]);
  const [productoId, setProductoId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    productos.list({ activo: 1 }).then(setAllProductos);
  }, []);

  const producto = useMemo(() => allProductos.find((p) => p.id === Number(productoId)), [allProductos, productoId]);
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
      const res = await productos.salida({
        producto_id: Number(productoId),
        cantidad: Number(cantidad),
        motivo: motivo || undefined,
      });
      showToast(`Salida registrada. Stock actualizado: ${res.stock_actual} unidades.`, 'success');
      setCantidad('');
      setMotivo('');
      productos.list({ activo: 1 }).then(setAllProductos);
      window.dispatchEvent(new CustomEvent('stock-updated'));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al registrar salida.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('entrada_inventario')) {
    return <p className="text-gray-500">No tiene permisos para registrar salidas.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Registro de salida de inventario</h1>
      <p className="text-gray-600 mb-6">
        Registre la salida de productos por venta. El sistema impide registrar cantidades mayores al stock disponible y genera alertas cuando el stock queda igual o por debajo del mínimo.
      </p>

      <form onSubmit={handleSubmit} className="max-w-xl bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
          <select
            value={productoId}
            onChange={(e) => setProductoId(e.target.value ? Number(e.target.value) : '')}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          >
            <option value="">Seleccionar producto</option>
            {allProductos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.marca_nombre} {p.modelo} {p.medida ? `(${p.medida})` : ''} — Stock: {p.stock_actual}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad * (máx. {stockDisponible})</label>
          <input
            type="number"
            min="1"
            max={stockDisponible}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value ? parseInt(e.target.value, 10) : '')}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
          {producto && cantidad > 0 && Number(cantidad) > stockDisponible && (
            <p className="text-red-600 text-sm mt-1">La cantidad supera el stock disponible.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
          <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="ej. Venta" />
        </div>
        <button type="submit" disabled={loading || (productoId && cantidad > 0 && Number(cantidad) > stockDisponible)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
          {loading ? 'Registrando...' : 'Registrar salida'}
        </button>
      </form>

      {producto && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-xl">
          <h3 className="font-medium text-gray-900 mb-2">Resumen</h3>
          <p><span className="text-gray-600">Producto:</span> {producto.marca_nombre} {producto.modelo}{producto.medida ? ` (${producto.medida})` : ''}</p>
          <p><span className="text-gray-600">Stock actual:</span> <strong>{producto.stock_actual}</strong></p>
          {producto.stock_minimo > 0 && (
            <p><span className="text-gray-600">Stock mínimo:</span> <strong>{producto.stock_minimo}</strong></p>
          )}
          {cantidad > 0 && Number(cantidad) <= stockDisponible && producto.stock_minimo > 0 && stockDisponible - Number(cantidad) <= producto.stock_minimo && (
            <p className="text-amber-600 font-medium mt-2">⚠️ Después de esta salida el stock quedará igual o por debajo del mínimo.</p>
          )}
        </div>
      )}
    </div>
  );
}
