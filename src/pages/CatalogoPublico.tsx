import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { productos, apiPublic, Producto } from '../api/client';

export default function CatalogoPublico() {
  const [items, setItems] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [tipos, setTipos] = useState<{ id: number; nombre: string }[]>([]);
  const [marcas, setMarcas] = useState<{ id: number; nombre: string; activo: number }[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroMarca, setFiltroMarca] = useState<string>('');
  const [filtroPrecioMin, setFiltroPrecioMin] = useState<string>('');
  const [filtroPrecioMax, setFiltroPrecioMax] = useState<string>('');
  const [mostrarAgotados, setMostrarAgotados] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: { categoria_id?: number; tipo_id?: number; marca_id?: number } = {};
      if (filtroCategoria) params.categoria_id = Number(filtroCategoria);
      if (filtroTipo) params.tipo_id = Number(filtroTipo);
      if (filtroMarca) params.marca_id = Number(filtroMarca);
      const lista = await productos.listPublic(params);
      let filtrada = lista;
      if (!mostrarAgotados) filtrada = filtrada.filter((p) => p.stock_actual > 0);
      if (filtroPrecioMin) {
        const min = parseFloat(filtroPrecioMin);
        if (!isNaN(min)) filtrada = filtrada.filter((p) => p.precio_venta >= min);
      }
      if (filtroPrecioMax) {
        const max = parseFloat(filtroPrecioMax);
        if (!isNaN(max)) filtrada = filtrada.filter((p) => p.precio_venta <= max);
      }
      setItems(filtrada);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el catálogo');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filtroCategoria, filtroTipo, filtroMarca, filtroPrecioMin, filtroPrecioMax, mostrarAgotados]);

  useEffect(() => {
    apiPublic<{ id: number; nombre: string }[]>('/public/categorias').then(setCategorias).catch(() => {});
    apiPublic<{ id: number; nombre: string }[]>('/public/tipos').then(setTipos).catch(() => {});
    apiPublic<{ id: number; nombre: string; activo: number }[]>('/public/marcas').then(setMarcas).catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link to="/tienda" className="text-xl font-bold text-primary-600">AMADS - Catálogo</Link>
            <div className="flex gap-4">
              <Link to="/login" className="text-sm text-gray-600 hover:text-primary-600">Iniciar sesión</Link>
              <Link to="/registro" className="text-sm text-primary-600 font-medium hover:underline">Crear cuenta</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Catálogo de productos</h1>
        <p className="text-gray-600 mb-6">
          Llantas, rines, amortiguadores, tuercas de seguridad y más. Puede ver productos sin iniciar sesión.
        </p>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
          <span className="font-medium text-gray-700">Filtros:</span>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
            <option value="">Todas las categorías</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={filtroMarca} onChange={(e) => setFiltroMarca(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
            <option value="">Todas las marcas</option>
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
            <option value="">Todos los tipos</option>
            {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          <input type="number" placeholder="Precio mín" value={filtroPrecioMin} onChange={(e) => setFiltroPrecioMin(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-24" />
          <input type="number" placeholder="Precio máx" value={filtroPrecioMax} onChange={(e) => setFiltroPrecioMax(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-24" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={mostrarAgotados} onChange={(e) => setMostrarAgotados(e.target.checked)} />
            Incluir agotados
          </label>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <div key={p.id} className={`bg-white rounded-lg border p-4 ${p.stock_actual === 0 ? 'opacity-75 border-gray-200' : 'border-gray-200 hover:shadow-md'}`}>
                <h3 className="font-semibold text-gray-900">{p.marca_nombre} {p.modelo}</h3>
                <p className="text-sm text-gray-600">{p.categoria_nombre} · {p.tipo_nombre}</p>
                {p.medida && <p className="text-sm text-gray-500">Medida: {p.medida}</p>}
                {p.color && <p className="text-sm text-gray-500">Color: {p.color}</p>}
                <p className="mt-2 text-lg font-semibold text-primary-600">${Number(p.precio_venta).toLocaleString()}</p>
                <p className={`text-sm ${p.stock_actual > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                  {p.stock_actual > 0 ? `${p.stock_actual} en existencia` : 'Agotado'}
                </p>
              </div>
            ))}
          </div>
        )}
        {!loading && items.length === 0 && !error && (
          <p className="text-center text-gray-500 py-8">No hay productos con los filtros seleccionados.</p>
        )}
      </main>
    </div>
  );
}
