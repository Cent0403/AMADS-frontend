import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productos, marcas, ProductoForm as ProductoFormType } from '../api/client';

export default function ProductoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [tipos, setTipos] = useState<{ id: number; nombre: string }[]>([]);
  const [marcasList, setMarcasList] = useState<{ id: number; nombre: string }[]>([]);
  const [form, setForm] = useState<Partial<ProductoFormType> & { stock_minimo?: number }>({
    codigo: '',
    marca_id: 0,
    modelo: '',
    categoria_id: 0,
    tipo_producto_id: 0,
    medida: '',
    indice_carga: '',
    indice_velocidad: '',
    color: '',
    precio_venta: 0,
    costo: 0,
    stock_minimo: 0,
  });

  useEffect(() => {
    productos.categorias().then(setCategorias);
    productos.tipos().then(setTipos);
    marcas.list().then(setMarcasList);
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      productos.get(Number(id)).then((p) => {
        setForm({
          codigo: p.codigo || '',
          marca_id: p.marca_id,
          modelo: p.modelo,
          categoria_id: p.categoria_id,
          tipo_producto_id: p.tipo_producto_id,
          medida: p.medida || '',
          indice_carga: p.indice_carga || '',
          indice_velocidad: p.indice_velocidad || '',
          color: p.color || '',
          precio_venta: p.precio_venta,
          costo: p.costo,
          stock_minimo: p.stock_minimo,
        });
      }).catch(() => navigate('/catalogo'));
    }
  }, [isEdit, id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.precio_venta! <= 0) {
      setError('El precio de venta debe ser mayor a cero.');
      return;
    }
    if (form.costo! < 0) {
      setError('El costo no puede ser negativo.');
      return;
    }
    if (form.stock_minimo !== undefined && form.stock_minimo < 0) {
      setError('El stock mínimo no puede ser negativo.');
      return;
    }
    setLoading(true);
    try {
      if (isEdit && id) {
        await productos.update(Number(id), {
          ...form,
          precio_venta: form.precio_venta,
          costo: form.costo,
          stock_minimo: form.stock_minimo,
        });
        navigate('/catalogo');
      } else {
        await productos.create({
          ...form,
          marca_id: form.marca_id!,
          modelo: form.modelo!,
          categoria_id: form.categoria_id!,
          tipo_producto_id: form.tipo_producto_id!,
          precio_venta: form.precio_venta!,
          costo: form.costo!,
          stock_minimo: form.stock_minimo ?? 0,
        });
        navigate('/catalogo');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 bg-white p-6 rounded-lg border border-gray-200">
        {error && <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input type="text" value={form.codigo || ''} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
            <select value={form.marca_id || ''} onChange={(e) => setForm({ ...form, marca_id: Number(e.target.value) })} className="w-full border border-gray-300 rounded-md px-3 py-2" required>
              <option value="">Seleccionar</option>
              {marcasList.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
          <input type="text" value={form.modelo || ''} onChange={(e) => setForm({ ...form, modelo: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select value={form.categoria_id || ''} onChange={(e) => setForm({ ...form, categoria_id: Number(e.target.value) })} className="w-full border border-gray-300 rounded-md px-3 py-2" required>
              <option value="">Seleccionar</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo (auto, camioneta, etc.) *</label>
            <select value={form.tipo_producto_id || ''} onChange={(e) => setForm({ ...form, tipo_producto_id: Number(e.target.value) })} className="w-full border border-gray-300 rounded-md px-3 py-2" required>
              <option value="">Seleccionar</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medida</label>
            <input type="text" value={form.medida || ''} onChange={(e) => setForm({ ...form, medida: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="ej. 205/55 R16" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Índice carga</label>
            <input type="text" value={form.indice_carga || ''} onChange={(e) => setForm({ ...form, indice_carga: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Índice velocidad</label>
            <input type="text" value={form.indice_velocidad || ''} onChange={(e) => setForm({ ...form, indice_velocidad: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color (opcional, para rines/accesorios)</label>
          <input type="text" value={form.color || ''} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio venta * (mayor a 0)</label>
            <input type="number" step="0.01" min="0.01" value={form.precio_venta ?? ''} onChange={(e) => setForm({ ...form, precio_venta: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-md px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo (≥ 0)</label>
            <input type="number" step="0.01" min="0" value={form.costo ?? ''} onChange={(e) => setForm({ ...form, costo: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo (≥ 0)</label>
            <input type="number" min="0" value={form.stock_minimo ?? ''} onChange={(e) => setForm({ ...form, stock_minimo: parseInt(e.target.value, 10) || 0 })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button type="button" onClick={() => navigate('/catalogo')} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
