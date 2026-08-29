# Intégration DODOME → next-shadcn-dashboard-starter — Plan d'exécution

**Objectif :** passer du `mock` (`src/constants/mock-api.ts` faker 20 products) à la **vraie API Django** `backend_management` (`https://dodome-backend.onrender.com/api`), puis étendre en **SaaS admin** complet.

## 1. Audit starter (fait)

| Starter | Mock actuel | API DODOME réelle |
|---|---|---|
| `auth` | `GithubProvider` + `CredentialProvider` fake `John` | `POST /api/auth/login/` -> `{access, refresh, user}` JWT, `POST /api/auth/refresh/` |
| `products` | `fakeProducts.getProducts({page,limit,search,categories})` paginé `faker` | `GET /api/businesses/<uuid>/items/?page=&page_size=&search=&category_id=` paginé DRF `{count,next,results}` + `Category` |
| `overview` | `delay(1000)` + `AreaGraph/BarGraph` statiques | `GET /businesses/<id>/dashboard/` + `/analytics/` + `/activities/` |
| `profile/kanban` | statique | `GET /auth/me/` + `GET /businesses/<id>/members/` |

**Contrainte multi-tenant RM-01 :** chaque requête doit porter `Authorization: Bearer <access>` + `X-Business-ID: <uuid>`.

## 2. Client réel livré
* `src/lib/dodome-api.ts` : `dodomeFetch` (base `NEXT_PUBLIC_API_URL`), `refresh` auto 401, `Paginated<T>`, `authApi/businessApi/catalogApi/analyticsApi`.
* `src/lib/auth.config.ts` : `CredentialProvider.authorize` appelle vraiment `POST ${API_BASE}/auth/login/` et retourne `{accessToken, refreshToken}`.
* `src/lib/auth.ts` : `jwt`/`session` callbacks persistent `accessToken`.
* `src/features/products/components/product-listing-real.tsx` : **POC** `catalogApi.items(businessId).then(toProduct)` réutilise `DataTable`/`columns` existants. Bascule via `NEXT_PUBLIC_DEFAULT_BUSINESS_ID`.

**Env :** copier `.env.local.example` -> `.env.local` et renseigner `NEXT_PUBLIC_API_URL` + `AUTH_SECRET` (`pnpx auth secret`).

## 3. POC — Comment tester
```bash
cd next-shadcn-dashboard-starter-main
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
echo "NEXT_PUBLIC_DEFAULT_BUSINESS_ID=9eeb4036-ed50-4c13-a29f-56862ed4db16" >> .env.local
pnpm dev # http://localhost:3000/dashboard/product
# Remplacer ProductListingPage par ProductListingReal dans src/app/dashboard/product/page.tsx :
# import ProductListingReal from '@/features/products/components/product-listing-real'
```
Le `DataTable` affiche désormais les vrais `Item.nom/prix/category/photo` (fallback `slingacademy` si pas de photo).

## 4. Roadmap admin avancée (après POC)

### Phase 1 — Socle (1 sem)
- [ ] `TeamSwitcher` -> `businessApi.list()` + `localStorage dodome_business_id` + header `X-Business-ID` global.
- [ ] Guard `middleware.ts` : redirige `/` -> `/dashboard` si `session.accessToken`.
- [ ] Remplacer tous les `fakeProducts` par `catalogApi` (product detail, create, edit -> `POST/PATCH /businesses/<id>/items/`).

### Phase 2 — Gestion (2 sem)
- [ ] **Stock** : `GET /businesses/<id>/stock/` + `POST /stock/movements/` (ENTREE/SORTIE) `src/app/dashboard/stock/page.tsx`.
- [ ] **Réservations** : `GET /businesses/<id>/reservations/` + `kanban` (colonnes EN_ATTENTE/VALIDEE/EN_COURS) avec `PATCH /reservations/<id>/valider/`.
- [ ] **Booking Requests** (public) : `GET /businesses/<id>/booking-requests/` + `POST /booking-requests/<id>/action/` (admin des demandes vitrine).
- [ ] **Membres/RBAC** : `GET /businesses/<id>/members/` + `POST /members/` (invite) + `GET /businesses/<id>/roles/` + `PATCH /roles/<id>/`.

### Phase 3 — Avancé (2 sem)
- [ ] **Analytics** : remplacer `AreaGraph/BarGraph/PieGraph` par `analyticsApi.dashboard()` (`total_revenue`, `subscriptions`, `sales`).
- [ ] **Entretien** : `GET /businesses/<id>/maintenance/tasks/` + `procedures` + `recurring_tasks`.
- [ ] **Facturation** : `GET /businesses/<id>/invoices/` + `pdf` + `mark-sent/mark-paid`.
- [ ] **Inventaires** : `GET /businesses/<id>/inventories/` + `counts/cloturer`.
- [ ] **Realtime** : `Pusher` / `SSE` sur `activities` + `notifications`.

## 5. Mapping colonnes `Product` -> `Item`
`Product.id:number` -> `Item.id:uuid` (adapter `toProduct` slice), `photo_url` -> `photos[0].image`, `category:string` -> `category.nom`, `price:number` -> `parseFloat(prix)`.

Supprimer `src/constants/mock-api.ts` et `@faker-js/faker` une fois toutes les features migrées.

---
*Généré le 2026-08-29 — POC testé `product-listing-real.tsx`.*
