# Category Mega-Menú Navbar

## Stack
- Frontend: Next.js 14 App Router + Tailwind CSS + Zustand
- Backend: NestJS 10 (ya listo, endpoint `/categories/tree`)
- DB: PostgreSQL vía Prisma (ya seed-eada con 12 categorías jerárquicas)

## Objetivo
Reemplazar el link plano "Categorías" del Navbar por un mega-menú desplegable con toda la jerarquía de categorías, consumiendo el endpoint `/categories/tree` del backend.

## Routing changes

| Ruta anterior | Ruta nueva | Tipo |
|---|---|---|
| `/products` | `/products` | Se mantiene, redirige a `/products/hombres` |
| — | `/products/[...categories]` | Catch-all: slug resuelve categoría (ej: `hombres/latin/camisas` → `hombres-latin-camisas`) |
| `/products/[slug]` | `/producto/[slug]` | Detalle de producto |

El catch-all une los segmentos con `-` para armar el slug. Ej:
- `/products/hombres` → slug: `hombres`
- `/products/hombres/latin` → slug: `hombres-latin`
- `/products/mujeres/latin/ropa-practica/tops` → slug: `mujeres-latin-ropa-practica-tops`

## Data flow

1. Navbar fetchea `GET /api/v1/categories/tree` al montar el layout
2. Responde árbol con 3 niveles de profundidad: raíz → disciplina → subcategoría
3. Se renderiza el mega-menú con esa data
4. Cada item linkea a `/products/[...categories]`

## Mega-menú Desktop (hover)

- Se abre con hover en "Categorías" (delay 200ms para evitar parpadeo)
- Panel de 2 columnas (Hombre | Mujer) con subcategorías indentadas
- Se cierra al hacer mouseleave o presionar Escape

## Mobile (touch)

- Tap en "Categorías" abre overlay
- Se cierra tocando fuera o con botón ✕
- Misma estructura visual, scroll vertical

## Componentes

### Nuevos
- `components/layout/CategoryMegaMenu.tsx` — El mega-menú + lógica de hover/touch
- `app/products/[...categories]/page.tsx` — Catch-all route para categorías

### Modificar
- `components/layout/Navbar.tsx` — Consumir `/categories/tree`, renderizar CategoryMegaMenu
- `app/products/[slug]/page.tsx` → mover a `app/producto/[slug]/page.tsx`

### Ajustes de imports
- Actualizar links internos que apunten a `/products/[slug]` → `/producto/[slug]`
- Buscar referencias en todo el frontend

## Dependencias
- Ninguna nueva. Ya usa `framer-motion`, `Link` de Next.js.
