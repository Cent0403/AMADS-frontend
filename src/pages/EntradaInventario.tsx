import { useEffect, useState, useMemo, useRef } from 'react';
import { productos, proveedores, Producto, Proveedor } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function EntradaInventario() {
  const { showToast } = useToast();
  const [allProductos, setAllProductos] = useState<Producto[]>([]);
  const [listaProveedores, setListaProveedores] = useState<Proveedor[]>([]);
  const [productosIdsProveedor, setProductosIdsProveedor] = useState<number[]>([]);
  const [productoId, setProductoId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [proveedorId, setProveedorId] = useState<number | ''>('');
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarDropdownProveedor, setMostrarDropdownProveedor] = useState(false);
  const [mostrarDropdownProducto, setMostrarDropdownProducto] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const dropdownProveedorRef = useRef<HTMLDivElement>(null);
  const dropdownProductoRef = useRef<HTMLDivElement>(null);

  const proveedoresActivos = useMemo(
    () => listaProveedores.filter((p) => p.activo),
    [listaProveedores]
  );

  const proveedoresFiltrados = useMemo(() => {
    const q = busquedaProveedor.trim().toLowerCase();
    if (!q) return proveedoresActivos;
    return proveedoresActivos.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [proveedoresActivos, busquedaProveedor]);

  const listaProductos = useMemo(
    () => allProductos.filter((p) => productosIdsProveedor.includes(p.id)),
    [allProductos, productosIdsProveedor]
  );

  const productosFiltrados = useMemo(() => {
    const q = busquedaProducto.trim().toLowerCase();
    if (!q) return listaProductos;
    return listaProductos.filter((p) => {
      const texto = [
        p.categoria_nombre,
        p.tipo_nombre,
        p.marca_nombre,
        p.modelo,
        p.medida,
        p.color,
        p.codigo,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return texto.includes(q);
    });
  }, [listaProductos, busquedaProducto]);

  useEffect(() => {
    productos.list({ activo: 1 }).then(setAllProductos);
    proveedores.list().then(setListaProveedores);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownProveedorRef.current && !dropdownProveedorRef.current.contains(e.target as Node)) setMostrarDropdownProveedor(false);
      if (dropdownProductoRef.current && !dropdownProductoRef.current.contains(e.target as Node)) setMostrarDropdownProducto(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!proveedorId) {
      setProductosIdsProveedor([]);
      setProductoId('');
      setBusquedaProducto('');
      setMostrarDropdownProducto(false);
      return;
    }
    proveedores.productos(Number(proveedorId)).then((prods) => {
      setProductosIdsProveedor(prods.map((p) => p.id));
      setProductoId('');
      setBusquedaProducto('');
      setMostrarDropdownProducto(false);
    }).catch(() => setProductosIdsProveedor([]));
  }, [proveedorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorId) {
      showToast('Seleccione un proveedor.', 'error');
      return;
    }
    if (!productoId || !cantidad || cantidad <= 0) {
      showToast('Seleccione un producto asociado al proveedor e ingrese una cantidad mayor a cero.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await productos.entrada({
        producto_id: Number(productoId),
        cantidad: Number(cantidad),
        proveedor_id: Number(proveedorId),
        observaciones: observaciones || undefined,
      });
      showToast(`Entrada registrada. Stock actualizado: ${res.stock_actual} unidades.`, 'success');
      setCantidad('');
      setObservaciones('');
      productos.list({ activo: 1 }).then(setAllProductos);
      window.dispatchEvent(new CustomEvent('stock-updated'));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al registrar entrada.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const producto = allProductos.find((p) => p.id === Number(productoId));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Registro de entrada de inventario</h1>
      <p className="text-gray-600 mb-6">
        Registre entrada de llantas y demás productos (rines, amortiguadores, tuercas de seguridad). Indique proveedor, tipo de producto, cantidad y revise que el color y especificaciones correspondan al ítem que está ingresando.
      </p>

      <form onSubmit={handleSubmit} className="max-w-xl bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
          <div ref={dropdownProveedorRef} className="relative">
            <input
              type="search"
              value={busquedaProveedor}
              onChange={(e) => {
                setBusquedaProveedor(e.target.value);
                setMostrarDropdownProveedor(true);
                setProveedorId('');
              }}
              onFocus={() => setMostrarDropdownProveedor(true)}
              placeholder="Seleccionar proveedor"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {mostrarDropdownProveedor && (
              <ul className="absolute z-10 mt-1 w-full max-h-44 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
                {proveedoresFiltrados.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-gray-500">No hay proveedores que coincidan.</li>
                ) : (
                  proveedoresFiltrados.map((p) => (
                    <li
                      key={p.id}
                      role="option"
                      aria-selected={proveedorId === p.id}
                      onClick={() => {
                        setProveedorId(p.id);
                        setBusquedaProveedor(p.nombre);
                        setMostrarDropdownProveedor(false);
                      }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${proveedorId === p.id ? 'bg-primary-50 text-primary-700' : ''}`}
                    >
                      {p.nombre}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Producto * (asociados al proveedor)</label>
          <div ref={dropdownProductoRef} className="relative">
            <input
              type="search"
              value={busquedaProducto}
              onChange={(e) => {
                setBusquedaProducto(e.target.value);
                setMostrarDropdownProducto(true);
                setProductoId('');
              }}
              onFocus={() => proveedorId && setMostrarDropdownProducto(true)}
              placeholder={!proveedorId ? 'Seleccione primero un proveedor' : 'Seleccionar producto'}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={!proveedorId}
            />
            {mostrarDropdownProducto && proveedorId && (
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
                        setBusquedaProducto(
                          `${p.categoria_nombre} · ${p.tipo_nombre} · ${p.marca_nombre} ${p.modelo}${p.medida ? ` (${p.medida})` : ''}`
                        );
                        setMostrarDropdownProducto(false);
                      }}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${productoId === p.id ? 'bg-primary-50 text-primary-700' : ''}`}
                    >
                      {p.categoria_nombre} · {p.tipo_nombre} · {p.marca_nombre} {p.modelo}
                      {p.medida ? ` (${p.medida})` : ''}
                      {p.color ? ` · Color: ${p.color}` : ''}
                      {' — Stock: '}{p.stock_actual}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad * (mayor a cero)</label>
          <input
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value ? parseInt(e.target.value, 10) : '')}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
          <input type="text" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
          {loading ? 'Registrando...' : 'Registrar entrada'}
        </button>
      </form>

      {producto && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-xl">
          <h3 className="font-medium text-gray-900 mb-2">Resumen del producto seleccionado</h3>
          <p><span className="text-gray-600">Tipo:</span> <strong>{producto.categoria_nombre}</strong> · {producto.tipo_nombre}</p>
          <p><span className="text-gray-600">Producto:</span> {producto.marca_nombre} {producto.modelo}{producto.medida ? ` (${producto.medida})` : ''}</p>
          {producto.color && <p><span className="text-gray-600">Color:</span> <strong>{producto.color}</strong></p>}
          <p><span className="text-gray-600">Cantidad a registrar:</span> <strong>{cantidad || '-'}</strong></p>
          <p><span className="text-gray-600">Stock actual:</span> <strong>{producto.stock_actual}</strong> unidades</p>
          {producto.stock_minimo > 0 && (
            <p><span className="text-gray-600">Stock mínimo:</span> <strong>{producto.stock_minimo}</strong></p>
          )}
        </div>
      )}
    </div>
  );
}
