import { useEffect, useState, useCallback, useRef, Fragment } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERMISOS } from '../constants/permissions';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { proveedores, productos, Proveedor, Producto } from '../api/client';

type ProductoAsoc = { id: number; codigo: string; modelo: string; marca: string; categoria: string };

type CompraItem = { producto_id: number; producto_nombre: string; cantidad: number; precio_unitario: number; subtotal: number };
type Compra = {
  id: number;
  fecha_compra: string;
  total: number;
  usuario_nombre: string;
  observaciones?: string | null;
  items?: CompraItem[];
};

function formatFecha(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return isoString;
  }
}

export default function ProveedorDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const puedeEditar = hasPermission(PERMISOS.PROVEEDORES_EDITAR);
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [productosAsoc, setProductosAsoc] = useState<ProductoAsoc[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<ProductoAsoc[]>([]);
  const [, setProductoInfo] = useState<Producto | null>(null);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [compraExpandida, setCompraExpandida] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | ''>('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [asociando, setAsociando] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const productosFiltrados = busquedaProducto.trim()
    ? productosDisponibles.filter((p) => {
        const q = busquedaProducto.trim().toLowerCase();
        const texto = [p.codigo, p.modelo, p.marca, p.categoria].filter(Boolean).join(' ').toLowerCase();
        return texto.includes(q);
      })
    : productosDisponibles;

  const cargar = useCallback(() => {
    if (!id) return;
    const pid = Number(id);
    proveedores.get(pid).then(setProveedor).catch(() => setProveedor(null));
    proveedores.productos(pid).then(setProductosAsoc).catch(() => setProductosAsoc([]));
    proveedores.compras(pid).then(setCompras).catch(() => setCompras([]));
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!id || !puedeEditar) return;
    proveedores.productosDisponibles(Number(id)).then(setProductosDisponibles).catch(() => setProductosDisponibles([]));
  }, [id, puedeEditar]);

  useEffect(() => {
    if (!productoSeleccionado) {
      setProductoInfo(null);
      return;
    }
    productos.get(Number(productoSeleccionado)).then(setProductoInfo).catch(() => setProductoInfo(null));
  }, [productoSeleccionado]);

  useEffect(() => {
    setLoading(!proveedor && id !== undefined);
  }, [proveedor, id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMostrarDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const asociarProducto = async () => {
    if (!id || !productoSeleccionado) return;
    setAsociando(true);
    try {
      await proveedores.asociarProducto(Number(id), Number(productoSeleccionado));
      setProductoSeleccionado('');
      setBusquedaProducto('');
      setProductoInfo(null);
      setMostrarDropdown(false);
      cargar();
      proveedores.productosDisponibles(Number(id)).then(setProductosDisponibles).catch(() => setProductosDisponibles([]));
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al asociar', 'error');
    } finally {
      setAsociando(false);
    }
  };

  const seleccionarProducto = (p: ProductoAsoc) => {
    setProductoSeleccionado(p.id);
    setBusquedaProducto(`${p.marca} ${p.modelo} (${p.categoria})${p.codigo ? ` - ${p.codigo}` : ''}`);
    setMostrarDropdown(false);
  };

  const desasociarProducto = async (productoId: number, nombreProd: string) => {
    if (!id) return;
    const ok = await confirm({
      title: 'Desasociar producto',
      message: `¿Desasociar "${nombreProd}" de este proveedor?`,
      confirmLabel: 'Desasociar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await proveedores.desasociarProducto(Number(id), productoId);
      cargar();
      proveedores.productosDisponibles(Number(id)).then(setProductosDisponibles).catch(() => setProductosDisponibles([]));
      showToast('Producto desasociado correctamente.', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al desasociar', 'error');
    }
  };

  const desactivarProveedor = async () => {
    if (!proveedor) return;
    const ok = await confirm({
      title: 'Desactivar proveedor',
      message: `¿Desactivar a "${proveedor.nombre}"? No aparecerá en nuevas compras.`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await proveedores.desactivar(proveedor.id);
      navigate('/proveedores');
      showToast('Proveedor desactivado.', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  };

  const reactivarProveedor = async () => {
    if (!proveedor) return;
    try {
      await proveedores.update(proveedor.id, { activo: true });
      cargar();
      showToast('Proveedor reactivado.', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al reactivar', 'error');
    }
  };

  if (!id) return <p className="text-gray-500">ID no válido</p>;
  if (loading && !proveedor) return <p className="text-gray-500">Cargando...</p>;
  if (!proveedor) return <p className="text-gray-500">Proveedor no encontrado</p>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <Link to="/proveedores" className="text-primary-600 hover:underline">← Volver a proveedores</Link>
        {puedeEditar && (
          <>
            <Link to={`/proveedores/editar/${id}`} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Editar proveedor</Link>
            {proveedor.activo ? (
              <button type="button" onClick={desactivarProveedor} className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50">
                Desactivar proveedor
              </button>
            ) : (
              <button type="button" onClick={reactivarProveedor} className="px-4 py-2 border border-green-300 text-green-700 rounded-md hover:bg-green-50">
                Reactivar proveedor
              </button>
            )}
          </>
        )}
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{proveedor.nombre}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Datos del proveedor</h2>
          <p className="text-xs text-gray-500 mb-2">Edite la información para mantener los datos correctos y actualizados.</p>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500">Contacto</dt><dd>{proveedor.contacto || '-'}</dd></div>
            <div><dt className="text-gray-500">Teléfono</dt><dd>{proveedor.telefono || '-'}</dd></div>
            <div><dt className="text-gray-500">Email</dt><dd>{proveedor.email || '-'}</dd></div>
            <div><dt className="text-gray-500">Dirección</dt><dd>{proveedor.direccion || '-'}</dd></div>
            <div><dt className="text-gray-500">Términos de pago</dt><dd>{proveedor.terminos_pago || '-'}</dd></div>
            <div><dt className="text-gray-500">Estado</dt><dd>{proveedor.activo ? 'Activo' : 'Desactivado'}</dd></div>
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Productos asociados</h2>
          <p className="text-xs text-gray-500 mb-2">Asocie los productos específicos que suministra este proveedor.</p>
          {productosAsoc.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay productos asociados.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {productosAsoc.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span>{p.marca} {p.modelo} ({p.categoria}) {p.codigo && `- ${p.codigo}`}</span>
                  {puedeEditar && (
                    <button type="button" onClick={() => desasociarProducto(p.id, `${p.marca} ${p.modelo}`)} className="text-red-600 hover:underline text-xs">
                      Desasociar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {puedeEditar && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">Asociar producto</label>
              <div className="flex gap-2 flex-wrap items-start">
                <div ref={dropdownRef} className="relative min-w-[280px] flex-1 max-w-md">
                  <input
                    type="text"
                    value={busquedaProducto}
                    onChange={(e) => {
                      setBusquedaProducto(e.target.value);
                      setMostrarDropdown(true);
                      if (!e.target.value) setProductoSeleccionado('');
                    }}
                    onFocus={() => productosDisponibles.length > 0 && setMostrarDropdown(true)}
                    placeholder="Buscar por código, modelo, marca o categoría..."
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm pr-8"
                  />
                  {mostrarDropdown && productosFiltrados.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
                      {productosFiltrados.map((p) => (
                        <li
                          key={p.id}
                          role="option"
                          aria-selected={productoSeleccionado === p.id}
                          onClick={() => seleccionarProducto(p)}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 ${productoSeleccionado === p.id ? 'bg-primary-50 text-primary-700' : ''}`}
                        >
                          {p.marca} {p.modelo} ({p.categoria}){p.codigo ? ` - ${p.codigo}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                  {mostrarDropdown && busquedaProducto.trim() && productosFiltrados.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full px-3 py-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-md shadow-lg">
                      No hay productos que coincidan con la búsqueda.
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={asociarProducto}
                  disabled={!productoSeleccionado || asociando || productosDisponibles.length === 0}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm shrink-0"
                >
                  {asociando ? 'Asociando...' : 'Asociar'}
                </button>
              </div>
              {productosDisponibles.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">Todos los productos activos ya están asociados a este proveedor.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Historial de compras</h2>
        <p className="text-xs text-gray-500 mb-3">Compras registradas al dar entrada de inventario con este proveedor.</p>
        {compras.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay compras registradas. Al registrar una entrada de inventario eligiendo este proveedor, aparecerá aquí.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Fecha</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-left py-2">Registrado por</th>
                  <th className="text-left py-2">Observaciones</th>
                  <th className="text-left py-2 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => (
                  <Fragment key={c.id}>
                    <tr
                      className={`border-b border-gray-100 ${(c.items?.length ?? 0) > 0 ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => (c.items?.length ? setCompraExpandida(compraExpandida === c.id ? null : c.id) : undefined)}
                    >
                      <td className="py-2 align-middle">{formatFecha(c.fecha_compra)}</td>
                      <td className="text-right py-2 align-middle">{c.total != null ? `$${Number(c.total).toLocaleString()}` : '-'}</td>
                      <td className="py-2 align-middle">{c.usuario_nombre || '-'}</td>
                      <td className="py-2 max-w-[200px] truncate align-middle" title={c.observaciones || undefined}>
                        {c.observaciones || '-'}
                      </td>
                      <td className="py-2 align-middle">
                        {(c.items?.length ?? 0) > 0 && (
                          <span className="text-primary-600 text-xs whitespace-nowrap hover:underline">
                            {compraExpandida === c.id ? '▲ Ocultar' : '▼ Ver detalle'}
                          </span>
                        )}
                      </td>
                    </tr>
                    {compraExpandida === c.id && c.items && c.items.length > 0 && (
                      <tr key={`${c.id}-detalle`} className="bg-gray-50">
                        <td colSpan={5} className="py-3 px-4">
                          <div className="text-xs">
                            <p className="font-medium text-gray-700 mb-2">Productos de la compra</p>
                            <table className="min-w-full">
                              <thead>
                                <tr className="text-gray-500">
                                  <th className="text-left py-1">Producto</th>
                                  <th className="text-right py-1">Cant.</th>
                                  <th className="text-right py-1">Precio unit.</th>
                                  <th className="text-right py-1">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {c.items.map((item) => (
                                  <tr key={item.producto_id} className="border-t border-gray-100">
                                    <td className="py-1">{item.producto_nombre}</td>
                                    <td className="text-right py-1">{item.cantidad}</td>
                                    <td className="text-right py-1">${Number(item.precio_unitario).toLocaleString()}</td>
                                    <td className="text-right py-1">${Number(item.subtotal).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
