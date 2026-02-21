import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERMISOS } from '../constants/permissions';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { proveedores, productos, Proveedor, Producto } from '../api/client';

type ProductoAsoc = { id: number; codigo: string; modelo: string; marca: string; categoria: string };

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
  const [compras, setCompras] = useState<{ id: number; fecha_compra: string; total: number; usuario_nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | ''>('');
  const [asociando, setAsociando] = useState(false);

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

  const asociarProducto = async () => {
    if (!id || !productoSeleccionado) return;
    setAsociando(true);
    try {
      await proveedores.asociarProducto(Number(id), Number(productoSeleccionado));
      setProductoSeleccionado('');
      setProductoInfo(null);
      cargar();
      proveedores.productosDisponibles(Number(id)).then(setProductosDisponibles).catch(() => setProductosDisponibles([]));
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al asociar', 'error');
    } finally {
      setAsociando(false);
    }
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
              <div className="flex gap-2 flex-wrap">
                <select
                  value={productoSeleccionado}
                  onChange={(e) => setProductoSeleccionado(e.target.value ? Number(e.target.value) : '')}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm min-w-[200px]"
                >
                  <option value="">Seleccionar producto</option>
                  {productosDisponibles.map((p) => (
                    <option key={p.id} value={p.id}>{p.marca} {p.modelo} ({p.categoria}) {p.codigo && `- ${p.codigo}`}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={asociarProducto}
                  disabled={!productoSeleccionado || asociando || productosDisponibles.length === 0}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm"
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
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="py-2">{formatFecha(c.fecha_compra)}</td>
                    <td className="text-right py-2">{c.total != null ? `$${Number(c.total).toLocaleString()}` : '-'}</td>
                    <td className="py-2">{c.usuario_nombre || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
