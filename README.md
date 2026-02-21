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

- **Dashboard** - Vista principal
- **Catálogo** - Gestión de productos y marcas
- **Entrada de inventario** - Registro de entradas
- **Proveedores** - CRUD de proveedores
- **Usuarios** - Gestión de usuarios
- **Roles y permisos** - Asignación de permisos

## API Backend

El frontend espera un backend en `http://localhost:4000`. Las peticiones a `/api` se redirigen automáticamente mediante el proxy configurado en Vite.

## Variables de entorno

Copia `.env.example` a `.env.local` y ajusta los valores:

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `VITE_API_URL` | URL base del API (en producción puede ser la URL completa) | `/api` |
| `VITE_API_BACKEND` | URL del backend para el proxy en desarrollo | `http://localhost:4000` |

```bash
cp .env.example .env.local
```
