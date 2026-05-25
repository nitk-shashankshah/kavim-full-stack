# Kavim — Flone eCommerce Platform

Full-stack eCommerce application deployed on Azure Kubernetes Service.

## Project Structure

```
kavim/
├── flone-backend/      Express REST API (Node.js + Azure SQL)
├── kavim-frontend/     React SPA (Create React App + Redux)
├── k8s/                Kubernetes manifests
└── flone/              Original static frontend (reference only, not deployed)
```

---

## Backend — flone-backend

**Stack:** Express 4, Sequelize 6, Azure SQL Server (via tedious), JWT auth, bcryptjs

**Entry point:** `server.js` → connects DB → `sequelize.sync()` → starts on `PORT` (default 5000)

**Start commands:**
```bash
npm start        # production
npm run dev      # development (nodemon)
npm run seed     # seed products from flone/src/data/products.json
```

**Environment variables** (see `.env.example`):
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DB_SERVER=kavim.database.windows.net
DB_NAME=kavim-sql
DB_USER=kavim
DB_PASSWORD=...
DB_PORT=1433
JWT_SECRET=...
JWT_EXPIRES_IN=7d
```

**API routes** (all prefixed `/api`):

| Resource | File |
|---|---|
| Users (auth) | `routes/userRoutes.js` |
| Products | `routes/productRoutes.js` |
| Categories | `routes/categoryRoutes.js` |
| Cart | `routes/cartRoutes.js` |
| Orders | `routes/orderRoutes.js` |
| Wishlist | `routes/wishlistRoutes.js` |

**Auth:** JWT Bearer token. `middleware/auth.js` exports `protect` (any user) and `adminOnly`.

**Database models:** all defined in `schema.js` — Product, ProductImage, ProductCategory, ProductTag, ProductVariation, VariationSize, Category, User, Cart, CartItem, Order, OrderItem, Wishlist, WishlistItem.

**Health check:** `GET /health` → `{ status: 'ok' }` (used by K8s readiness probe)

---

## Frontend — kavim-frontend

**Stack:** React 18, Redux Toolkit, redux-persist, Axios, React Router 6, Bootstrap 5, SCSS

**Start commands:**
```bash
npm start        # dev server (localhost:3001 / port in .env)
npm run build    # production build → /build
```

**Environment variables:**
```
REACT_APP_API_URL=/api    # In Docker/K8s (nginx proxies /api → backend)
REACT_APP_API_URL=http://localhost:5001/api    # Local dev
```

**Redux slices** (`src/store/slices/`):

| Slice | Persisted | Purpose |
|---|---|---|
| `auth-slice.js` | yes | JWT token, user profile |
| `cart-slice.js` | yes | Cart items + API sync thunks |
| `wishlist-slice.js` | yes | Wishlist items + API sync thunks |
| `product-slice.js` | no | Product catalog (fetched from API on load) |
| `order-slice.js` | no | Order placement |
| `compare-slice.js` | yes | Product compare list |
| `currency-slice.js` | yes | Active currency (EUR/USD/GBP) |

**API services** (`src/services/`): `api.js` (axios instance with JWT interceptor), `authService.js`, `productService.js`, `cartService.js`, `wishlistService.js`, `orderService.js`, `categoryService.js`

**Key pages:**
- `src/pages/other/LoginRegister.js` — login / register forms
- `src/pages/other/Checkout.js` — billing form + order placement
- `src/pages/other/MyAccount.js` — profile + password update
- `src/pages/other/Cart.js` — cart management

**Product fallback:** On startup, `src/index.js` calls `fetchProducts()` from the API; if the API is unreachable it falls back to the bundled `src/data/products.json`.

---

## Kubernetes — k8s/

**Cluster:** `kavimCluster` (AKS, East US), resource group `kavim`  
**Registry:** `kavim.azurecr.io`  
**Namespace:** `kavim`  
**Frontend public IP:** `20.22.61.17`

**Manifests:**

| File | Kind | Purpose |
|---|---|---|
| `namespace.yaml` | Namespace | `kavim` namespace |
| `backend-secret.yaml` | Secret | DB creds + JWT secret |
| `backend-configmap.yaml` | ConfigMap | Non-sensitive env vars |
| `backend-deployment.yaml` | Deployment | `kavim.azurecr.io/flone-backend:latest` |
| `backend-service.yaml` | Service (ClusterIP) | Internal backend access |
| `frontend-deployment.yaml` | Deployment | `kavim.azurecr.io/flone-frontend:latest` |
| `frontend-service.yaml` | Service (LoadBalancer) | Public frontend access |

**nginx routing (frontend container):** Static files served at `/`; `/api/*` proxied to `http://flone-backend:5000/api/` via `nginx.conf`.

---

## Deploy Workflow

### Build & push images (always use `--platform linux/amd64` — dev machine is Apple Silicon)
```bash
az acr login --name kavim

docker build --platform linux/amd64 -t kavim.azurecr.io/flone-backend:latest ./flone-backend
docker push kavim.azurecr.io/flone-backend:latest

docker build --platform linux/amd64 -t kavim.azurecr.io/flone-frontend:latest ./kavim-frontend
docker push kavim.azurecr.io/flone-frontend:latest
```

### Apply manifests
```bash
kubectl apply -f k8s/
kubectl rollout restart deployment/flone-backend -n kavim
kubectl rollout restart deployment/flone-frontend -n kavim
```

### Useful kubectl commands
```bash
kubectl get pods -n kavim
kubectl logs -n kavim deployment/flone-backend
kubectl logs -n kavim deployment/flone-frontend
kubectl port-forward deployment/flone-backend 5000:5000 -n kavim   # test API locally
kubectl get service flone-frontend -n kavim                         # get public IP
```

---

## Azure SQL

**Server:** `kavim.database.windows.net`  
**Database:** `kavim-sql`  
Tables are auto-created by `sequelize.sync()` on backend startup. To reset: drop all tables in dependency order (children before parents) and restart the backend.

---

## Important Notes

- **Always build with `--platform linux/amd64`** — AKS nodes are AMD64, dev machine is ARM64 (Apple Silicon). Building without this flag produces images that fail with `no match for platform in manifest`.
- **Never commit `k8s/backend-secret.yaml`** with real credentials to version control.
- **FRONTEND_URL** in `backend-configmap.yaml` is set to `http://20.22.61.17` for CORS. Update this if the LoadBalancer IP changes.
- The `flone/` directory is the original static template (reference only) — it is not deployed.
