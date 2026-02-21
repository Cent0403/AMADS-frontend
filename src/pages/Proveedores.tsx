import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { proveedores, Proveedor } from '../api/client';

export default function Proveedores() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const puedeEditar = hasPermission('proveedores_editar');
  const [items, setItems] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    setLoading(true);
    proveedores.list().then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const desactivar = async (id: number, nombre: string) => {
    const ok = await confirm({
      title: 'Desactivar proveedor',
      message: `¿Desactivar al proveedor "${nombre}"? No aparecerá en nuevas compras.`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await proveedores.desactivar(id);
      cargar();
      showToast('Proveedor desactivado.', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  };

  const reactivar = async (id: number) => {
    try {
      await proveedores.update(id, { activo: true });
      cargar();
      showToast('Proveedor reactivado.', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
        {puedeEditar && (
          <Link to="/proveedores/nuevo" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
            Nuevo proveedor
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono / Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Términos de pago</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Activo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((p) => (
                  <tr key={p.id} className={!p.activo ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.contacto || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.telefono || '-'} {p.email && ` / ${p.email}`}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.terminos_pago || '-'}</td>
                    <td className="px-4 py-3 text-center text-sm">{p.activo ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                        {puedeEditar && <Link to={`/proveedores/editar/${p.id}`} className="text-primary-600 hover:underline text-sm">Editar</Link>}
                        {puedeEditar && Boolean(p.activo) && (
                          <button type="button" onClick={() => desactivar(p.id, p.nombre)} className="text-red-600 hover:underline text-sm">Desactivar</button>
                        )}
                        {puedeEditar && !p.activo && (
                          <button type="button" onClick={() => reactivar(p.id)} className="text-green-600 hover:underline text-sm">Reactivar</button>
                        )}
                        <Link to={`/proveedores/${p.id}`} className="text-gray-600 hover:underline text-sm">Ver detalle</Link>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && <p className="p-6 text-center text-gray-500">No hay proveedores.</p>}
        </div>
      )}
    </div>
  );
}
