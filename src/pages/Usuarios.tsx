import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { usuarios as apiUsuarios, Usuario } from '../api/client';

export default function Usuarios() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [items, setItems] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ email: '', password: '', nombre: '', apellido: '', rol_id: 0 });
  const [error, setError] = useState('');

  const cargar = () => {
    setLoading(true);
    apiUsuarios.list().then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
    apiUsuarios.roles().then(setRoles);
  }, []);

  const openCreate = () => {
    setForm({ email: '', password: '', nombre: '', apellido: '', rol_id: roles[0]?.id || 0 });
    setEditingId(null);
    setModal('create');
    setError('');
  };

  const openEdit = (u: Usuario) => {
    setForm({
      email: u.email,
      password: '',
      nombre: u.nombre,
      apellido: u.apellido || '',
      rol_id: u.rol_id ?? 0,
    });
    setEditingId(u.id);
    setModal('edit');
    setError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.nombre.trim() || !form.email.trim()) {
      setError('Nombre y correo son obligatorios.');
      return;
    }
    try {
      await apiUsuarios.create({
        email: form.email,
        password: form.password || undefined,
        nombre: form.nombre,
        apellido: form.apellido || undefined,
        rol_id: form.rol_id,
      });
      setModal(null);
      cargar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setError('');
    try {
      await apiUsuarios.update(editingId, {
        email: form.email,
        password: form.password || undefined,
        nombre: form.nombre,
        apellido: form.apellido || undefined,
        rol_id: form.rol_id,
        activo: undefined,
      });
      setModal(null);
      cargar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  const toggleActivo = async (u: Usuario) => {
    const ok = await confirm({
      title: u.activo ? 'Desactivar usuario' : 'Activar usuario',
      message: `¿${u.activo ? 'Desactivar' : 'Activar'} a ${u.nombre}?`,
      confirmLabel: u.activo ? 'Desactivar' : 'Activar',
      variant: u.activo ? 'danger' : 'default',
    });
    if (!ok) return;
    try {
      await apiUsuarios.update(u.id, { activo: !u.activo });
      cargar();
      showToast(u.activo ? 'Usuario desactivado.' : 'Usuario activado.', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const rolNombre = (r: string) => r.replace(/_/g, ' ');

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios del sistema</h1>
        <div className="flex gap-2">
          {hasPermission('permisos_asignar') && (
            <Link to="/usuarios/roles-permisos" className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700">
              Administrar roles y permisos
            </Link>
          )}
          <button type="button" onClick={openCreate} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
            Nuevo usuario
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Activo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((u) => (
                <tr key={u.id} className={!u.activo ? 'bg-gray-50' : ''}>
                  <td className="px-4 py-3 text-sm">{u.nombre} {u.apellido}</td>
                  <td className="px-4 py-3 text-sm">{u.email}</td>
                  <td className="px-4 py-3 text-sm capitalize">{rolNombre(u.rol)}</td>
                  <td className="px-4 py-3 text-center">
                    <button type="button" onClick={() => toggleActivo(u)} className={`text-sm font-medium ${u.activo ? 'text-green-600' : 'text-gray-400'}`}>
                      {u.activo ? 'Sí' : 'No'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.rol !== 'administrador' && (
                      <button type="button" onClick={() => openEdit(u)} className="text-primary-600 hover:underline text-sm mr-2">Editar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4">{modal === 'create' ? 'Nuevo usuario' : 'Editar usuario'}</h2>
            <form onSubmit={modal === 'create' ? handleCreate : handleUpdate} className="space-y-4">
              {error && <div className="p-2 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" required disabled={modal === 'edit'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{modal === 'edit' ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input type="text" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select value={form.rol_id} onChange={(e) => setForm({ ...form, rol_id: Number(e.target.value) })} className="w-full border border-gray-300 rounded-md px-3 py-2" required>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{rolNombre(r.nombre)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                  {modal === 'create' ? 'Crear' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
