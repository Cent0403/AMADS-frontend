import { useEffect, useState, useCallback } from 'react';
import { marcas as marcasApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

type MarcaRow = { id: number; nombre: string; activo: number };

export default function Marcas() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [items, setItems] = useState<MarcaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [incluirInactivas, setIncluirInactivas] = useState(false);
  const [modal, setModal] = useState<'crear' | { editar: MarcaRow } | null>(null);
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    setLoading(true);
    marcasApi.list(!incluirInactivas).then(setItems).finally(() => setLoading(false));
  }, [incluirInactivas]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirCrear = () => {
    setNombre('');
    setActivo(true);
    setError('');
    setModal('crear');
  };

  const abrirEditar = (m: MarcaRow) => {
    setNombre(m.nombre);
    setActivo(Boolean(m.activo));
    setError('');
    setModal({ editar: m });
  };

  const cerrarModal = () => {
    setModal(null);
    setError('');
  };

  const guardarCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await marcasApi.create(nombre.trim());
      cerrarModal();
      cargar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  const guardarEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal || !('editar' in modal)) return;
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await marcasApi.update(modal.editar.id, { nombre: nombre.trim(), activo });
      cerrarModal();
      cargar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const desactivar = async (id: number, nombreMarca: string) => {
    const ok = await confirm({
      title: 'Desactivar marca',
      message: `¿Desactivar la marca "${nombreMarca}"? No aparecerá en el catálogo al crear productos.`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await marcasApi.desactivar(id);
      cargar();
      showToast('Marca desactivada.', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  };

  const reactivar = async (id: number) => {
    try {
      await marcasApi.update(id, { activo: true });
      cargar();
      showToast('Marca reactivada.', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marcas del catálogo</h1>
        <button
          type="button"
          onClick={abrirCrear}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Nueva marca
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={incluirInactivas}
            onChange={(e) => setIncluirInactivas(e.target.checked)}
          />
          Incluir marcas inactivas
        </label>
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
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Activo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((m) => (
                  <tr key={m.id} className={!m.activo ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.nombre}</td>
                    <td className="px-4 py-3 text-center text-sm">{m.activo ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => abrirEditar(m)}
                        className="text-primary-600 hover:underline text-sm"
                      >
                        Editar
                      </button>
                      {m.activo ? (
                        <button
                          type="button"
                          onClick={() => desactivar(m.id, m.nombre)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => reactivar(m.id)}
                          className="text-green-600 hover:underline text-sm"
                        >
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <p className="p-6 text-center text-gray-500">
              {incluirInactivas ? 'No hay marcas.' : 'No hay marcas activas. Activa "Incluir marcas inactivas" para ver todas.'}
            </p>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={cerrarModal}>
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {modal === 'crear' ? 'Nueva marca' : 'Editar marca'}
            </h2>
            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
            )}
            <form
              onSubmit={modal === 'crear' ? guardarCrear : guardarEditar}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                  autoFocus
                />
              </div>
              {modal !== 'crear' && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                  />
                  Activa (visible en catálogo)
                </label>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
