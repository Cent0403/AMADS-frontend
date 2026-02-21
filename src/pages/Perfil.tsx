import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function Perfil() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [apellido, setApellido] = useState(user?.apellido ?? '');

  useEffect(() => {
    setNombre(user?.nombre ?? '');
    setApellido(user?.apellido ?? '');
  }, [user]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setLoading(true);
    try {
      await auth.updateProfile({ nombre: nombre.trim(), apellido: apellido.trim() || undefined });
      await refreshUser();
      showToast('Datos actualizados correctamente.', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
      showToast('Error al actualizar el perfil.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</h1>
      <p className="text-gray-600 mb-6">
        Actualice sus datos de contacto. No puede modificar información de otros empleados.
      </p>

      <form onSubmit={handleSubmit} className="max-w-md bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
          <input type="email" value={user?.email ?? ''} disabled className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-gray-500" />
          <p className="text-xs text-gray-500 mt-1">El correo no se puede modificar.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
          <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <input type="text" value={user?.rol ?? ''} disabled className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-gray-500" />
        </div>
        {error && <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}
        <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
