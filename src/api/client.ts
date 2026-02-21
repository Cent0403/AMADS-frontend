const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || 'Error en la petición');
  return data as T;
}

/** API sin token para endpoints públicos (catálogo, registro) */
export async function apiPublic<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || 'Error en la petición');
  return data as T;
}

export const auth = {
  login: (email: string, password: string) =>
    api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => api<User>('/auth/me'),
  updateProfile: (body: { nombre?: string; apellido?: string }) =>
    api<{ message: string }>('/auth/perfil', { method: 'PUT', body: JSON.stringify(body) }),
  registroCliente: (body: { email: string; password: string; nombre: string; apellido?: string; telefono?: string }) =>
    api<{ message: string }>('/auth/registro-cliente', { method: 'POST', body: JSON.stringify(body) }),
};

export const usuarios = {
  list: () => api<Usuario[]>('/usuarios'),
  roles: () => api<{ id: number; nombre: string }[]>('/usuarios/roles'),
  create: (body: { email: string; password?: string; nombre: string; apellido?: string; rol_id: number }) =>
    api<{ id: number }>('/usuarios', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<Usuario & { password?: string; rol_id?: number; activo?: boolean }>) =>
    api<{ message: string }>(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  desactivar: (id: number) => api<{ message: string }>(`/usuarios/${id}`, { method: 'DELETE' }),
};

export const productos = {
  list: (params?: { categoria_id?: number; tipo_id?: number; marca_id?: number; activo?: number }) => {
    const entries = params
      ? Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
      : [];
    const q = entries.length ? new URLSearchParams(entries as [string, string][]).toString() : '';
    return api<Producto[]>(`/productos${q ? `?${q}` : ''}`);
  },
  /** Catálogo público (sin auth) - usa /public/productos si existe, sino /productos */
  listPublic: (params?: { categoria_id?: number; tipo_id?: number; marca_id?: number }) => {
    const entries = params ? Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]) : [];
    const q = entries.length ? new URLSearchParams(entries as [string, string][]).toString() : '';
    return apiPublic<Producto[]>(`/public/productos${q ? `?${q}` : ''}`);
  },
  get: (id: number) => api<Producto>(`/productos/${id}`),
  categorias: () => api<{ id: number; nombre: string }[]>('/productos/categorias'),
  tipos: () => api<{ id: number; nombre: string }[]>('/productos/tipos'),
  marcas: () => api<{ id: number; nombre: string; activo: number }[]>('/productos/marcas'),
  stockBajo: () => api<StockBajo[]>('/productos/stock-bajo'),
  create: (body: ProductoForm) => api<{ id: number }>('/productos', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<ProductoForm & { activo?: number }>) =>
    api<{ message: string }>(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  entrada: (body: { producto_id: number; cantidad: number; proveedor_id?: number; observaciones?: string }) =>
    api<{ stock_actual: number }>('/productos/entrada', { method: 'POST', body: JSON.stringify(body) }),
  salida: (body: { producto_id: number; cantidad: number; motivo?: string }) =>
    api<{ stock_actual: number }>('/productos/salida', { method: 'POST', body: JSON.stringify(body) }),
  reportarDanado: (body: { producto_id: number; cantidad: number; motivo?: string }) =>
    api<{ message: string }>('/productos/danados', { method: 'POST', body: JSON.stringify(body) }),
};

export const marcas = {
  list: (soloActivos = true) =>
    api<{ id: number; nombre: string; activo: number }[]>(`/marcas${soloActivos ? '' : '?activo=0'}`),
  create: (nombre: string) => api<{ id: number }>('/marcas', { method: 'POST', body: JSON.stringify({ nombre }) }),
  update: (id: number, body: { nombre?: string; activo?: boolean }) =>
    api<{ message: string }>(`/marcas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  desactivar: (id: number) => api<{ message: string }>(`/marcas/${id}`, { method: 'DELETE' }),
};

export const proveedores = {
  list: () => api<Proveedor[]>('/proveedores'),
  get: (id: number) => api<Proveedor>(`/proveedores/${id}`),
  productos: (id: number) => api<{ id: number; codigo: string; modelo: string; marca: string; categoria: string }[]>(`/proveedores/${id}/productos`),
  productosDisponibles: (id: number) => api<{ id: number; codigo: string; modelo: string; marca: string; categoria: string }[]>(`/proveedores/${id}/productos-disponibles`),
  compras: (id: number) => api<{ id: number; fecha_compra: string; total: number; usuario_nombre: string }[]>(`/proveedores/${id}/compras`),
  create: (body: ProveedorForm) => api<{ id: number }>('/proveedores', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<ProveedorForm & { activo?: boolean }>) =>
    api<{ message: string }>(`/proveedores/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  asociarProducto: (proveedorId: number, productoId: number) =>
    api<{ message: string }>(`/proveedores/${proveedorId}/productos`, { method: 'POST', body: JSON.stringify({ producto_id: productoId }) }),
  desasociarProducto: (proveedorId: number, productoId: number) =>
    api<{ message: string }>(`/proveedores/${proveedorId}/productos/${productoId}`, { method: 'DELETE' }),
  desactivar: (id: number) => api<{ message: string }>(`/proveedores/${id}`, { method: 'DELETE' }),
};

export interface Permiso {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface RolConPermisos {
  id: number;
  nombre: string;
  descripcion: string | null;
  permiso_ids: number[];
}

export const reportes = {
  inventario: (params?: { categoria_id?: number; tipo_id?: number; marca_id?: number; proveedor_id?: number }) => {
    const entries = params ? Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]) : [];
    const q = entries.length ? new URLSearchParams(entries as [string, string][]).toString() : '';
    const listParams = params ? { categoria_id: params.categoria_id, tipo_id: params.tipo_id } : undefined;
    return api<Producto[]>(`/reportes/inventario${q ? `?${q}` : ''}`).catch(() => productos.list(listParams));
  },
  ventas: (params?: { desde?: string; hasta?: string; vendedor_id?: number; producto_id?: number }) => {
    const entries = params ? Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]) : [];
    const q = entries.length ? new URLSearchParams(entries as [string, string][]).toString() : '';
    return api<ReporteVenta[]>(`/reportes/ventas${q ? `?${q}` : ''}`);
  },
  compras: (params?: { desde?: string; hasta?: string; proveedor_id?: number }) => {
    const entries = params ? Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]) : [];
    const q = entries.length ? new URLSearchParams(entries as [string, string][]).toString() : '';
    return api<ReporteCompra[]>(`/reportes/compras${q ? `?${q}` : ''}`);
  },
  utilidades: (params?: { desde?: string; hasta?: string }) => {
    const entries = params ? Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]) : [];
    const q = entries.length ? new URLSearchParams(entries as [string, string][]).toString() : '';
    return api<ReporteUtilidad>(`/reportes/utilidades${q ? `?${q}` : ''}`);
  },
};

export interface ReporteVenta {
  id: number;
  fecha: string;
  total: number;
  vendedor_nombre: string;
  cliente_nombre?: string;
  productos?: { nombre: string; cantidad: number; subtotal: number }[];
}

export interface ReporteCompra {
  id: number;
  fecha: string;
  total: number;
  proveedor_nombre: string;
  usuario_nombre: string;
}

export interface ReporteUtilidad {
  ventas_totales: number;
  compras_totales: number;
  utilidad: number;
  margen?: number;
}

export const roles = {
  listPermisos: () => api<Permiso[]>('/permisos'),
  listRoles: () => api<RolConPermisos[]>('/roles'),
  updatePermisos: (rolId: number, permisoIds: number[]) =>
    api<{ message: string }>(`/roles/${rolId}/permisos`, { method: 'PUT', body: JSON.stringify({ permiso_ids: permisoIds }) }),
};

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido?: string;
  rol: string;
  activo?: boolean;
  permisos?: string[];
}

export interface Usuario extends User {
  rol_id?: number;
  created_at?: string;
}

export interface Producto {
  id: number;
  codigo?: string;
  marca_id: number;
  marca_nombre: string;
  modelo: string;
  categoria_id: number;
  categoria_nombre: string;
  tipo_producto_id: number;
  tipo_nombre: string;
  medida?: string;
  indice_carga?: string;
  indice_velocidad?: string;
  color?: string;
  especificaciones_extra?: Record<string, unknown>;
  precio_venta: number;
  costo: number;
  stock_actual: number;
  stock_minimo: number;
  activo: number;
}

export interface ProductoForm {
  codigo?: string;
  marca_id: number;
  modelo: string;
  categoria_id: number;
  tipo_producto_id: number;
  medida?: string;
  indice_carga?: string;
  indice_velocidad?: string;
  color?: string;
  especificaciones_extra?: Record<string, unknown>;
  precio_venta: number;
  costo: number;
  stock_minimo?: number;
}

export interface StockBajo {
  id: number;
  codigo: string;
  modelo: string;
  marca: string;
  categoria: string;
  tipo: string;
  stock_actual: number;
  stock_minimo: number;
  faltante: number;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  terminos_pago?: string;
  activo: number;
  created_at?: string;
}

export interface ProveedorForm {
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  terminos_pago?: string;
}
