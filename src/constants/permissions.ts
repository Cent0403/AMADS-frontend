/**
 * Códigos de permisos del sistema.
 * Deben coincidir con los permisos en la base de datos (ejecutar npm run seed:permisos en el backend).
 */
export const PERMISOS = {
  CATALOGO_VER: 'catalogo_ver',
  CATALOGO_EDITAR: 'catalogo_editar',
  ENTRADA_INVENTARIO: 'entrada_inventario',
  PROVEEDORES_VER: 'proveedores_ver',
  PROVEEDORES_EDITAR: 'proveedores_editar',
  USUARIOS_GESTIONAR: 'usuarios_gestionar',
  PERMISOS_ASIGNAR: 'permisos_asignar',
  REPORTES_VER: 'reportes_ver',
} as const;

export type PermisoCodigo = (typeof PERMISOS)[keyof typeof PERMISOS];
