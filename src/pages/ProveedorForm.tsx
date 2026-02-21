import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { proveedores, ProveedorForm as ProveedorFormType } from '../api/client';

const emptyForm: ProveedorFormType = {
  nombre: '',
  contacto: '',
  telefono: '',
  email: '',
  direccion: '',
  terminos_pago: '',
};

export default function ProveedorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ProveedorFormType>(emptyForm);

  useEffect(() => {
    if (isEdit && id) {
      proveedores.get(Number(id)).then((p) => {
        setForm({
          nombre: p.nombre,
          contacto: p.contacto || '',
          telefono: p.telefono || '',
          email: p.email || '',
          direccion: p.direccion || '',
          terminos_pago: p.terminos_pago || '',
        });
      }).catch(() => navigate('/proveedores'));
    }
  }, [isEdit, id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setLoading(true);
    try {
      if (isEdit && id) {
        await proveedores.update(Number(id), form);
        navigate('/proveedores');
      } else {
        await proveedores.create(form);
        navigate('/proveedores');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}</h1>
      {isEdit && <p className="text-sm text-gray-500 mb-6">Actualice la información para mantener los datos correctos.</p>}
      <form onSubmit={handleSubmit} className="max-w-xl bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        {error && <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
            <input type="text" value={form.contacto || ''} onChange={(e) => setForm({ ...form, contacto: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input type="text" value={form.telefono || ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <textarea value={form.direccion || ''} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" rows={2} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Términos de pago</label>
          <input type="text" value={form.terminos_pago || ''} onChange={(e) => setForm({ ...form, terminos_pago: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="ej. 30 días, contado" />
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button type="button" onClick={() => navigate('/proveedores')} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
