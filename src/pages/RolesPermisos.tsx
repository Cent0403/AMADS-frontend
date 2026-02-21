import { useEffect, useState } from 'react';
import { roles as rolesApi, Permiso, RolConPermisos } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function RolesPermisos() {
  const { showToast } = useToast();
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [rolesList, setRolesList] = useState<RolConPermisos[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRolId, setEditingRolId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([rolesApi.listPermisos(), rolesApi.listRoles()]).then(([p, r]) => {
      setPermisos(p);
      setRolesList(r);
    }).finally(() => setLoading(false));
  }, []);

  const openEdit = (rol: RolConPermisos) => {
    setEditingRolId(rol.id);
    setSelectedIds(rol.permiso_ids || []);
  };

  const togglePermiso = (permisoId: number) => {
    setSelectedIds((prev) =>
      prev.includes(permisoId) ? prev.filter((id) => id !== permisoId) : [...prev, permisoId]
    );
  };

  const guardar = async () => {
    if (editingRolId == null) return;
    setSaving(true);
    try {
      await rolesApi.updatePermisos(editingRolId, selectedIds);
      const [_, r] = await Promise.all([rolesApi.listPermisos(), rolesApi.listRoles()]);
      setRolesList(r);
      setEditingRolId(null);
      showToast('Permisos actualizados correctamente.', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const rolNombre = (nombre: string) => nombre.replace(/_/g, ' ');

  if (loading) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Roles y permisos</h1>
      <p className="text-gray-600 mb-6">
        Asigne los permisos que tendrá cada rol. Los usuarios con ese rol podrán realizar solo las acciones permitidas.
      </p>

      <div className="space-y-6">
        {rolesList.map((rol) => (
          <div key={rol.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-semibold text-gray-900 capitalize">{rolNombre(rol.nombre)}</span>
                {rol.descripcion && <span className="text-gray-500 text-sm ml-2">— {rol.descripcion}</span>}
              </div>
              {rol.nombre !== 'administrador' && (
                <button
                  type="button"
                  onClick={() => (editingRolId === rol.id ? setEditingRolId(null) : openEdit(rol))}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  {editingRolId === rol.id ? 'Cancelar' : 'Asignar permisos'}
                </button>
              )}
            </div>
            {editingRolId === rol.id && (
              <div className="p-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Seleccione los permisos para este rol:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {permisos.map((p) => (
                    <label key={p.id} className="flex items-start gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => togglePermiso(p.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-medium text-gray-900">{p.nombre}</span>
                        {p.descripcion && <span className="text-gray-500 block text-xs">{p.descripcion}</span>}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={guardar}
                    disabled={saving}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingRolId(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
