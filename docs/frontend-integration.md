# Integración Frontend ↔ Backend — Bisuteria Rodio

Guía de referencia para consumir la API desde Next.js. Cubre los endpoints de productos, los tipos TypeScript que debe definir el frontend, y los patrones de paginación para la página de inicio y el catálogo.

---

## Base URL

```
# Desarrollo
http://localhost:3001/api

# Producción
https://<tu-dominio>/api
```

Configura esto en `.env.local` de Next.js:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Tipos TypeScript compartidos

Define estos tipos una vez (p. ej. en `src/types/api.ts`) y reutilízalos en toda la app.

```ts
// src/types/api.ts

export interface ProductImage {
  id:     string;
  url:    string;
  order:  number;
  width:  number | null;
  height: number | null;
}

export interface ProductCategory {
  id:   string;
  name: string;
  slug: string;
}

export interface ProductColor {
  id:   string;
  name: string;
  slug: string;
  hex:  string;
}

export interface Product {
  id:       string;
  name:     string;
  price:    number;   // entero en centavos o pesos según tu convención
  stock:    number;
  ventas:   number;
  category: ProductCategory;
  color:    ProductColor;
  images:   ProductImage[];
}

// Respuesta de GET /api/products
export interface GetProductsResponse {
  products: Product[];
  total:    number;    // total de productos que cumplen los filtros (sin paginar)
}

// Respuesta de GET /api/products/:id
export interface GetProductByIdResponse {
  product: Product & { createdAt: string };
}
```

---

## Endpoint: `GET /api/products`

Devuelve productos visibles con soporte de filtros y paginación.

### Query params

| Parámetro      | Tipo     | Requerido | Descripción |
|----------------|----------|-----------|-------------|
| `limit`        | `number` | No        | Cantidad máxima de productos a devolver (1–100) |
| `offset`       | `number` | No        | Cuántos productos saltar (para scroll infinito) |
| `categorySlug` | `string` | No        | Filtrar por categoría |
| `colorSlug`    | `string` | No        | Filtrar por color |
| `search`       | `string` | No        | Búsqueda por nombre (insensible a mayúsculas) |
| `sort`         | `string` | No        | `price_asc` \| `price_desc` \| `name_asc` \| `name_desc` \| `most_sold` |
| `priceMin`     | `number` | No        | Precio mínimo (entero) |
| `priceMax`     | `number` | No        | Precio máximo (entero) |

> Si no se manda `limit` ni `offset`, el endpoint devuelve todos los productos visibles (comportamiento anterior, útil para el panel admin).

### Respuesta

```json
{
  "products": [
    {
      "id": "clxyz123",
      "name": "Pulsera de plata",
      "price": 15000,
      "stock": 8,
      "ventas": 42,
      "category": { "id": "cat1", "name": "Pulseras", "slug": "pulseras" },
      "color":    { "id": "col1", "name": "Plateado", "slug": "plateado", "hex": "#C0C0C0" },
      "images": [
        { "id": "img1", "url": "https://res.cloudinary.com/...", "order": 0, "width": 800, "height": 800 }
      ]
    }
  ],
  "total": 86
}
```

---

## Función fetcher base

```ts
// src/lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface ProductFilters {
  limit?:        number;
  offset?:       number;
  categorySlug?: string;
  colorSlug?:    string;
  search?:       string;
  sort?:         'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'most_sold';
  priceMin?:     number;
  priceMax?:     number;
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<GetProductsResponse> {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }

  const res = await fetch(`${API_URL}/products?${params.toString()}`, {
    next: { revalidate: 60 }, // ISR: revalida cada 60s (ajusta según necesidad)
  });

  if (!res.ok) throw new Error(`Error ${res.status} al obtener productos`);

  return res.json() as Promise<GetProductsResponse>;
}

export async function fetchProductById(id: string): Promise<GetProductByIdResponse> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`Error ${res.status} al obtener el producto`);

  return res.json() as Promise<GetProductByIdResponse>;
}
```

---

## Página de inicio — carga limitada

La home carga un número fijo de productos según el dispositivo. La detección de móvil/escritorio se hace **en el servidor** (Server Component) usando el header `user-agent`, evitando layout shifts.

```tsx
// src/app/page.tsx  (Server Component)

import { headers } from 'next/headers';
import { fetchProducts } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

function isMobile(ua: string | null): boolean {
  if (!ua) return false;
  return /mobile|android|iphone|ipad/i.test(ua);
}

export default async function HomePage() {
  const ua     = headers().get('user-agent');
  const limit  = isMobile(ua) ? 4 : 8;

  const { products } = await fetchProducts({ limit, sort: 'most_sold' });

  return (
    <section>
      <h2>Productos destacados</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
```

---

## Catálogo — scroll infinito

El catálogo usa un Client Component que carga 24 productos iniciales (desde el servidor) y luego va cargando los siguientes bloques a medida que el usuario hace scroll.

### 1. Server Component que hidrata el estado inicial

```tsx
// src/app/catalogo/page.tsx  (Server Component)

import { fetchProducts } from '@/lib/api';
import { CatalogClient } from '@/components/CatalogClient';

const PAGE_SIZE = 24;

export default async function CatalogoPage() {
  // Primera carga en el servidor para SEO y tiempo de respuesta
  const { products: initialProducts, total } = await fetchProducts({
    limit:  PAGE_SIZE,
    offset: 0,
    sort:   'most_sold',
  });

  return (
    <CatalogClient
      initialProducts={initialProducts}
      total={total}
      pageSize={PAGE_SIZE}
    />
  );
}
```

### 2. Client Component con scroll infinito

```tsx
// src/components/CatalogClient.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchProducts, type ProductFilters } from '@/lib/api';
import type { Product } from '@/types/api';
import { ProductCard } from './ProductCard';

interface Props {
  initialProducts: Product[];
  total:           number;
  pageSize:        number;
}

export function CatalogClient({ initialProducts, total, pageSize }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [offset,   setOffset]   = useState(pageSize);
  const [loading,  setLoading]  = useState(false);
  const [filters,  setFilters]  = useState<ProductFilters>({});
  const loaderRef = useRef<HTMLDivElement>(null);

  const hasMore = products.length < total;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const { products: next } = await fetchProducts({
        ...filters,
        limit:  pageSize,
        offset,
      });

      setProducts((prev) => [...prev, ...next]);
      setOffset((prev) => prev + pageSize);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, filters, offset, pageSize]);

  // Intersection Observer — dispara loadMore cuando el div loader es visible
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // Al cambiar filtros, reinicia la lista
  const applyFilters = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    setProducts([]);
    setOffset(0);
    // La primera carga con los nuevos filtros se dispara sola
    // porque el offset queda en 0 y el observer detecta que el loader es visible
  };

  return (
    <div>
      {/* Aquí va tu barra de filtros, pasa applyFilters como callback */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Elemento que el observer vigila */}
      <div ref={loaderRef} className="h-10 flex items-center justify-center">
        {loading  && <span>Cargando...</span>}
        {!hasMore && products.length > 0 && <span>No hay más productos</span>}
      </div>
    </div>
  );
}
```

### 3. Variante con botón "Cargar más" (alternativa al scroll infinito)

Si prefieres un botón explícito en lugar del observer:

```tsx
// Reemplaza el div ref={loaderRef} y el useEffect del observer con:

<div className="flex justify-center mt-8">
  {hasMore && (
    <button
      onClick={loadMore}
      disabled={loading}
      className="px-6 py-2 bg-black text-white rounded disabled:opacity-50"
    >
      {loading ? 'Cargando...' : 'Cargar más productos'}
    </button>
  )}
</div>
```

---

## Filtros combinados con paginación

Cuando el usuario aplica un filtro, el offset debe reiniciarse a 0. El total que devuelve la API ya refleja los productos que cumplen el filtro, no el total global.

```tsx
// Ejemplo: el usuario selecciona la categoría "pulseras"

const { products, total } = await fetchProducts({
  categorySlug: 'pulseras',
  limit:        24,
  offset:       0,
  sort:         'price_asc',
});

// total = cantidad de pulseras visibles (no los 86 totales)
// El frontend sabe cuándo parar: products.length >= total
```

---

## Resumen de llamadas por pantalla

| Pantalla | Endpoint | Params clave |
|----------|----------|--------------|
| Home (escritorio) | `GET /api/products` | `limit=8&sort=most_sold` |
| Home (móvil) | `GET /api/products` | `limit=4&sort=most_sold` |
| Catálogo — carga inicial | `GET /api/products` | `limit=24&offset=0` |
| Catálogo — siguiente bloque | `GET /api/products` | `limit=24&offset=24` |
| Detalle de producto | `GET /api/products/:id` | — |
| Catálogo con filtro | `GET /api/products` | `limit=24&offset=0&categorySlug=pulseras` |

---

## Notas importantes

- **`total` refleja los filtros activos** — si el usuario filtra por categoría, `total` es el número de productos en esa categoría, no los 86 globales. Usa siempre `products.length >= total` para saber si hay más páginas.
- **Orden por defecto** — sin `sort`, la API ordena por `ventas desc` (más vendidos primero).
- **Sin `limit` ni `offset`** — devuelve todos los productos; útil internamente pero no recomendado para páginas públicas con muchos productos.
- **`price` es un entero** — si usas precios en pesos colombianos o similares, formatéalo con `Intl.NumberFormat` en el frontend.
