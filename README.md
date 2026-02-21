# AMADS Frontend

Frontend de la aplicación AMADS (sistema de gestión de inventario y almacén) desarrollado con React, TypeScript y Vite.

## Tecnologías

- **React 18** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Vite 5** - Build tool y dev server
- **React Router 6** - Enrutamiento
- **Tailwind CSS** - Estilos

## Requisitos previos

- Node.js 18+ 
- npm o pnpm

## Instalación

```bash
npm install
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo en http://localhost:3000 |
| `npm run build` | Compila el proyecto para producción |
| `npm run preview` | Sirve la build de producción localmente |

## Estructura del proyecto

```
src/
├── api/           # Cliente API
├── components/    # Componentes reutilizables
├── context/       # Contextos (Auth, Toast, Confirm)
├── pages/         # Páginas/vistas
├── App.tsx
└── main.tsx
```

## Funcionalidades

### Administrador
- **Dashboard** - Vista principal con alertas de stock bajo
- **Catálogo** - Gestión de productos, marcas, precios, stock mínimo
- **Entrada/Salida inventario** - Registro de entradas y salidas
- **Productos dañados** - Reportar productos defectuosos
- **Proveedores** - CRUD de proveedores
- **Usuarios** - Gestión de usuarios y roles
- **Roles y permisos** - Asignación de permisos
- **Reporte inventario** - Filtros por categoría, marca, proveedor; exportación PDF/Excel
- **Reportes financieros** - Ventas, compras y utilidades (requiere endpoints backend)

### Encargado de bodega
- **Entrada inventario** - Registrar entrada de productos
- **Salida inventario** - Registrar salida por venta
- **Productos dañados** - Reportar defectuosos
- **Perfil** - Actualizar datos de contacto

### Empleado
- **Catálogo** - Consultar disponibilidad
- **Perfil** - Actualizar datos de contacto

### Cliente (público)
- **Catálogo público** (`/tienda`) - Ver productos sin login
- **Registro** (`/registro`) - Crear cuenta de cliente

## API Backend

El frontend espera un backend en `http://localhost:4000`. Las peticiones a `/api` se redirigen automáticamente mediante el proxy configurado en Vite.

### Endpoints adicionales requeridos

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/productos/salida` | Registrar salida (body: `producto_id`, `cantidad`, `motivo?`) |
| POST | `/productos/danados` | Reportar producto dañado |
| PUT | `/auth/perfil` | Actualizar perfil (nombre, apellido) |
| POST | `/auth/registro-cliente` | Registro de clientes |
| GET | `/public/productos` | Catálogo público (opcional; fallback a `/productos`) |
| GET | `/reportes/ventas` | Reporte ventas (params: desde, hasta) |
| GET | `/reportes/compras` | Reporte compras |
| GET | `/reportes/utilidades` | Reporte utilidades |

## Variables de entorno

Copia `.env.example` a `.env.local` y ajusta los valores:

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `VITE_API_URL` | URL base del API (en producción puede ser la URL completa) | `/api` |
| `VITE_API_BACKEND` | URL del backend para el proxy en desarrollo | `http://localhost:4000` |

```bash
cp .env.example .env.local
```
