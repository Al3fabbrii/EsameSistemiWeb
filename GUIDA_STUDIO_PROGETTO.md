# Guida di Studio - Shop Online E-commerce
## Progetto Sistemi Web AA 2025/2026

---

## Indice

1. [Introduzione e Panoramica](#1-introduzione-e-panoramica)
2. [Architettura Generale del Sistema](#2-architettura-generale-del-sistema)
3. [Backend Ruby on Rails](#3-backend-ruby-on-rails)
4. [Frontend Angular](#4-frontend-angular)
5. [Flussi Applicativi Principali](#5-flussi-applicativi-principali)
6. [Sicurezza e Autenticazione](#6-sicurezza-e-autenticazione)
7. [Funzionalità Avanzate](#7-funzionalità-avanzate)
8. [Testing](#8-testing)
9. [Deployment e Docker](#9-deployment-e-docker)
10. [Verifica Conformità alle Specifiche](#10-verifica-conformità-alle-specifiche)
11. [Domande Frequenti per la Discussione Orale](#11-domande-frequenti-per-la-discussione-orale)

---

## 1. Introduzione e Panoramica

### Cos'è il progetto

Questo progetto è un'applicazione web full-stack di **e-commerce** che permette agli utenti di:
- Navigare un catalogo prodotti con filtri e ricerca
- Gestire un carrello persistente salvato sul backend
- Effettuare ordini tramite un sistema di checkout
- Visualizzare lo storico completo degli ordini
- Autenticarsi con sistema di login sicuro (JWT)
- Gestire una lista dei desideri (wishlist)
- Utilizzare l'interfaccia in italiano o inglese

### Stack Tecnologico

**Backend:**
- Ruby on Rails 8.1.1 in modalità API
- SQLite3 come database
- JWT per autenticazione
- BCrypt per hash delle password

**Frontend:**
- Angular 21.0.0
- TypeScript 5.9.2
- Angular Material 21.0.0 per UI
- RxJS 7.8.0 per programmazione reattiva

**DevOps:**
- Docker e Docker Compose
- Configurazione CORS per comunicazione cross-origin

---

## 2. Architettura Generale del Sistema

### Architettura a Tre Livelli

```
┌──────────────────────────────────────────────┐
│          FRONTEND (Angular 21)                │
│  - Componenti UI                              │
│  - Servizi per business logic                 │
│  - Routing e Guards                           │
│  - HTTP Interceptors                          │
└──────────────────┬───────────────────────────┘
                   │
                   │ HTTP REST API
                   │ (JSON)
                   │
┌──────────────────▼───────────────────────────┐
│        BACKEND (Rails 8.1 API)                │
│  - Controllers (API REST)                     │
│  - Models (ActiveRecord)                      │
│  - JWT Authentication                         │
└──────────────────┬───────────────────────────┘
                   │
                   │ ActiveRecord ORM
                   │
┌──────────────────▼───────────────────────────┐
│         DATABASE (SQLite3)                    │
│  - users, products, orders                    │
│  - carts, wishlists                           │
│  - order_items, cart_items                    │
└──────────────────────────────────────────────┘
```

### Pattern Architetturale

- **Backend**: MVC semplificato (Model + Controller, no Views)
- **Frontend**: Component-based architecture con separazione tra:
  - **Features**: moduli funzionali (products, cart, checkout, etc.)
  - **Core**: servizi condivisi e logica di business
  - **Shared**: componenti riutilizzabili

### Comunicazione Frontend-Backend

**Protocollo**: HTTP REST over JSON
**Base URL**: `http://localhost:3000/api`
**Autenticazione**: JWT Bearer Token nell'header Authorization

Esempio richiesta autenticata:
```http
GET /api/cart HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

---

## 3. Backend Ruby on Rails

### 3.1 Modello Dati

#### Schema Database

Il database è composto da 8 tabelle principali:

**1. users**
- Gestisce gli account utente
- Campi: `id`, `email_address`, `password_digest`, `created_at`, `updated_at`
- Password criptate con BCrypt (`has_secure_password`)

**2. products**
- Catalogo prodotti
- Campi: `id` (STRING), `title`, `description`, `price`, `original_price`, `sale`, `thumbnail`, `tags` (JSON), `stock`, `created_at`
- Nota: L'ID è di tipo STRING (non auto-increment) per supportare SKU personalizzati

**3. carts**
- Carrello dell'utente
- Campi: `id`, `user_id` (FK), `created_at`, `updated_at`
- Relazione: Un utente può avere più carrelli (ma usa solo l'ultimo)

**4. cart_items**
- Articoli nel carrello
- Campi: `id`, `cart_id` (FK), `item_id` (product_id), `quantity`, `unit_price`
- Constraint: Unique (cart_id, item_id) → un prodotto appare una sola volta per carrello

**5. orders**
- Ordini completati
- Campi: `id`, `user_id` (FK), `total`, `customer` (JSON), `address` (JSON), `created_at`
- I dati cliente e indirizzo sono salvati come JSON per flessibilità

**6. order_items**
- Dettaglio articoli ordinati
- Campi: `id`, `order_id` (FK), `product_id` (FK), `quantity`, `unit_price`
- `unit_price` è **congelato** al momento dell'ordine (storicizza il prezzo)

**7. wishlists**
- Lista desideri utente
- Campi: `id`, `user_id` (FK), `created_at`, `updated_at`

**8. wishlist_items**
- Prodotti nella wishlist
- Campi: `id`, `wishlist_id` (FK), `item_id` (product_id)

#### Relazioni tra Modelli

```ruby
User
  has_many :carts
  has_many :orders
  has_many :wishlists

Cart
  belongs_to :user
  has_many :cart_items
  has_many :products, through: :cart_items

Order
  belongs_to :user
  has_many :order_items
  has_many :products, through: :order_items

Product
  has_many :cart_items
  has_many :order_items
```

### 3.2 API Endpoints

#### Autenticazione (`/api/auth`)

| Endpoint | Metodo | Descrizione | Auth Required |
|----------|--------|-------------|---------------|
| `/auth/login` | POST | Login con email/password → restituisce JWT | No |
| `/auth/register` | POST | Registrazione nuovo utente | No |
| `/auth/me` | GET | Dati utente corrente | Sì |
| `/auth/logout` | POST | Logout (stateless, no-op server-side) | Sì |

**Login Flow:**
```
1. Client → POST /auth/login con { email, password }
2. Backend verifica credenziali con User.authenticate
3. Se valide → genera JWT con payload { user_id, exp }
4. Restituisce { token, user }
5. Client salva token in localStorage
```

**JWT Payload:**
```json
{
  "user_id": 123,
  "exp": 1735862400
}
```
- Algoritmo: HS256
- Secret: `Rails.application.secret_key_base`
- Scadenza: 24 ore

#### Prodotti (`/api/products`)

| Endpoint | Metodo | Descrizione | Parametri |
|----------|--------|-------------|-----------|
| `/products` | GET | Lista prodotti con filtri | `search`, `price_min`, `price_max`, `sort` |
| `/products/:id` | GET | Dettaglio singolo prodotto | - |

**Filtri supportati:**
- `search`: Ricerca testuale case-insensitive nel titolo
- `price_min`, `price_max`: Range di prezzo
- `sort`: Ordinamento
  - `price_asc`: Prezzo crescente
  - `price_desc`: Prezzo decrescente
  - `date_asc`: Data creazione crescente
  - `date_desc`: Data creazione decrescente (default)

Esempio:
```http
GET /api/products?search=laptop&price_min=500&price_max=2000&sort=price_asc
```

#### Carrello (`/api/cart`)

| Endpoint | Metodo | Descrizione | Body |
|----------|--------|-------------|------|
| `/cart` | GET | Stato carrello corrente | - |
| `/cart/items` | POST | Aggiungi prodotto | `{ product_id, quantity }` |
| `/cart/items/:id` | PATCH | Modifica quantità | `{ quantity }` |
| `/cart/items/:id` | DELETE | Rimuovi prodotto | - |

**Logica di aggiunta al carrello:**
1. Verifica stock disponibile del prodotto
2. Se prodotto già nel carrello → incrementa quantità
3. Se prodotto nuovo → crea CartItem
4. Restituisce carrello aggiornato con totale ricalcolato

**Calcolo totale:**
```ruby
cart.total = cart.cart_items.sum { |item| item.quantity * item.unit_price }
```

#### Ordini (`/api/orders`)

| Endpoint | Metodo | Descrizione | Parametri |
|----------|--------|-------------|-----------|
| `/orders` | GET | Lista ordini utente | `date_from`, `date_to`, `total_min`, `total_max`, `sort` |
| `/orders/:id` | GET | Dettaglio ordine | - |
| `/orders` | POST | Crea nuovo ordine | `{ customer, address, items, total }` |

**Filtri per GET /orders:**
- `date_from`, `date_to`: Range date ISO 8601 (es. "2025-01-01")
- `total_min`, `total_max`: Range totale ordine
- `sort`: `date_asc`, `date_desc`, `total_asc`, `total_desc`

**Processo creazione ordine (POST /orders):**

```ruby
# 1. Validazione stock per ogni prodotto
items.each do |item|
  product = Product.find(item[:product_id])
  if product.stock < item[:quantity]
    return error 422 "Stock insufficiente"
  end
end

# 2. Transazione atomica
ActiveRecord::Base.transaction do
  # 2a. Crea Order con dati customer e address (JSON)
  order = Order.create!(
    user: current_user,
    total: total,
    customer: customer_data,
    address: address_data
  )

  # 2b. Crea OrderItems e decrementa stock
  items.each do |item|
    product = Product.find(item[:product_id])
    order.order_items.create!(
      product: product,
      quantity: item[:quantity],
      unit_price: product.price  # Congela il prezzo
    )
    product.decrement!(:stock, item[:quantity])
  end

  # 2c. Svuota il carrello
  current_user.current_cart.cart_items.destroy_all
end

# 3. Restituisce ordine creato
```

**Importanza della transazione:**
Se qualsiasi step fallisce (es. stock non sufficiente durante il processo), viene fatto ROLLBACK completo.

#### Wishlist (`/api/wishlist`)

| Endpoint | Metodo | Descrizione | Body |
|----------|--------|-------------|------|
| `/wishlist` | GET | Lista desideri | - |
| `/wishlist/items` | POST | Aggiungi a preferiti | `{ product_id }` |
| `/wishlist/items/:id` | DELETE | Rimuovi da preferiti | - |

### 3.3 Validazioni

Le validazioni sono implementate a livello di modello con ActiveRecord:

**User:**
```ruby
validates :email_address, presence: true, uniqueness: true,
          format: { with: URI::MailTo::EMAIL_REGEXP }
has_secure_password  # Validazione automatica password
```

**Product:**
```ruby
validates :title, presence: true
validates :price, presence: true, numericality: { greater_than: 0 }
validates :stock, presence: true, numericality: { greater_than_or_equal_to: 0 }
```

**Order:**
```ruby
validates :total, presence: true, numericality: { greater_than: 0 }
validates :customer, :address, presence: true
```

**CartItem / OrderItem:**
```ruby
validates :quantity, presence: true, numericality: { only_integer: true, greater_than: 0 }
validates :unit_price, presence: true, numericality: { greater_than: 0 }
```

### 3.4 Gestione Errori

**Status HTTP utilizzati:**
- `200 OK`: Richiesta riuscita
- `201 Created`: Risorsa creata (es. ordine, utente)
- `204 No Content`: Operazione riuscita senza body (es. DELETE)
- `400 Bad Request`: Parametri mancanti o malformati
- `401 Unauthorized`: Token mancante, invalido o scaduto
- `404 Not Found`: Risorsa non trovata
- `422 Unprocessable Entity`: Validazione fallita
- `500 Internal Server Error`: Errore server

**Formato risposta errore:**
```json
{
  "error": "Messaggio di errore dettagliato",
  "details": ["campo1: deve essere presente", "campo2: deve essere maggiore di 0"]
}
```

### 3.5 Middleware e Concerns

**JWT Authentication** (`app/controllers/concerns/jwt_authentication.rb`)

```ruby
module JwtAuthentication
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
  end

  private

  def authenticate_user!
    token = extract_token_from_header
    decoded = JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256')
    @current_user = User.find(decoded[0]['user_id'])
  rescue JWT::DecodeError
    render json: { error: 'Invalid token' }, status: :unauthorized
  end
end
```

**Skip authentication per endpoint pubblici:**
```ruby
class ProductsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index, :show]
end
```

**CORS Configuration** (`config/initializers/cors.rb`)

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'http://localhost:4200'  # Frontend Angular
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
```

---

## 4. Frontend Angular

### 4.1 Architettura Componenti

#### Struttura Folder

```
src/app/
├── core/                    # Logica condivisa dell'applicazione
│   ├── services/            # Servizi per comunicazione backend
│   ├── models/              # Interfacce TypeScript
│   ├── guards/              # Route guards per protezione
│   └── interceptors/        # HTTP interceptors
├── features/                # Moduli funzionali (feature-based)
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   ├── auth/
│   ├── user-area/
│   └── wishlist/
├── shared/                  # Componenti riutilizzabili
│   └── header/
├── app.component.ts         # Root component
├── app.routes.ts            # Configurazione routing
└── app.config.ts            # Configurazione applicazione
```

#### Componenti Principali

**1. ProductPage** (`features/products/product-page`)
- **Responsabilità**: Visualizza catalogo prodotti con filtri e paginazione
- **Features**:
  - Ricerca testuale con debounce 300ms
  - Filtri per range di prezzo (min/max)
  - Ordinamento (prezzo, data)
  - Paginazione client-side (10 prodotti per pagina)
- **RxJS**: `combineLatest`, `debounceTime`, `distinctUntilChanged`, `shareReplay`
- **Material**: MatFormField, MatInput, MatSelect, MatPaginator

**2. ProductDetailPage** (`features/products/product-detail-page`)
- **Responsabilità**: Mostra dettaglio singolo prodotto
- **Routing**: Route param `:id` (es. `/product/123`)
- **Features**:
  - Carica prodotto da backend via `switchMap`
  - Bottoni "Aggiungi al carrello" e "Aggiungi ai preferiti"

**3. CartPage** (`features/cart/cart-page`)
- **Responsabilità**: Visualizza e gestisce il carrello
- **Features**:
  - Modifica quantità con bottoni +/-
  - Rimozione prodotti
  - Calcolo totale in tempo reale
  - Link al checkout
- **State**: Sottoscrive a `CartService.cart$` (Observable)

**4. CheckoutPage** (`features/checkout/checkout-page`)
- **Responsabilità**: Form per completare l'ordine
- **Features**:
  - Reactive Forms con validazione:
    - Nome, cognome (minLength: 2)
    - Email (pattern email)
    - Indirizzo, città, CAP
    - Checkbox privacy
  - Riepilogo ordine
  - Feedback di loading durante invio
- **Flow**:
  1. Valida form
  2. Chiama `OrderService.create()`
  3. Se successo → redirect a `/user-area` con messaggio
  4. Se errore → mostra errore tramite NotificationService

**5. UserAreaPage** (`features/user-area/user-area-page`)
- **Responsabilità**: Dashboard utente con storico ordini
- **Features**:
  - Filtri avanzati:
    - Range date (Material DatePicker)
    - Range totale (min/max)
    - Ordinamento
  - Lista ordini con dettagli completi
  - Espansione dettaglio ordine

**6. WishlistPage** (`features/wishlist/wishlist-page`)
- **Responsabilità**: Gestione lista desideri
- **Features**:
  - Visualizza prodotti preferiti
  - Bottone "Aggiungi al carrello" per ogni prodotto
  - Rimozione dalla wishlist

**7. LoggingPage** (`features/auth/logging-page`)
- **Responsabilità**: Login utente
- **Features**:
  - Form con email e password
  - Validazione client-side
  - Gestione errori autenticazione
  - Redirect dopo login

**8. RegisterPage** (`features/auth/register-page`)
- **Responsabilità**: Registrazione nuovo utente
- **Features**: Simile a LoggingPage ma con POST /auth/register

**9. Header** (`shared/header`)
- **Responsabilità**: Navbar globale
- **Features**:
  - Menu navigazione
  - Selector lingua (IT/EN con flag)
  - Badge carrello con conteggio items
  - Bottoni login/logout
  - Menu dropdown con Material

### 4.2 Servizi Core

#### AuthService

**File**: `core/services/auth-service.ts`

**Responsabilità**: Gestione autenticazione e stato utente

**Proprietà:**
```typescript
currentUser$: BehaviorSubject<User | null>  // Stato reattivo utente
private TOKEN_KEY = 'auth_token'
```

**Metodi:**
```typescript
login(email: string, password: string): Observable<User>
  // 1. POST /api/auth/login
  // 2. Salva token in localStorage
  // 3. Aggiorna currentUser$
  // 4. Restituisce User

logout(): void
  // 1. POST /api/auth/logout
  // 2. Rimuove token da localStorage
  // 3. Resetta currentUser$
  // 4. Redirect a /login

register(email: string, password: string): Observable<User>
  // POST /api/auth/register

loadCurrentUser(): void
  // GET /api/auth/me al boot dell'app
  // Se 401 → logout automatico

getToken(): string | null
  // Legge token da localStorage

isLoggedIn(): boolean
  // Verifica presenza token
```

**Pattern utilizzato:**
- **Stateful service** con BehaviorSubject per reattività
- Centralizza tutta la logica autenticazione

#### ProductApi

**File**: `core/services/product-api.ts`

**Responsabilità**: Comunicazione con API prodotti

**Metodi:**
```typescript
interface ProductFilters {
  search?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc';
}

list(filters?: ProductFilters): Observable<Product[]>
  // GET /api/products con query params dinamici

getById(id: string): Observable<Product>
  // GET /api/products/:id
```

**Costruzione query params:**
```typescript
let params = new HttpParams();
if (filters?.search) {
  params = params.set('search', filters.search);
}
if (filters?.priceMin) {
  params = params.set('price_min', filters.priceMin.toString());
}
// ...
return this.http.get<Product[]>(`${this.apiUrl}/products`, { params });
```

#### CartService

**File**: `core/services/cart.ts`

**Responsabilità**: Gestione stato carrello e sincronizzazione backend

**Proprietà:**
```typescript
private cartSubject = new BehaviorSubject<Cart | null>(null);
cart$ = this.cartSubject.asObservable();  // Observable pubblico

get itemCount(): number {
  return this.cartSubject.value?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
}

get total(): number {
  return this.cartSubject.value?.total || 0;
}
```

**Metodi:**
```typescript
loadCart(): void
  // GET /api/cart
  // Aggiorna cartSubject

addItem(productId: string, quantity: number): Observable<Cart>
  // POST /api/cart/items
  // Aggiorna cartSubject con risposta

updateItem(itemId: number, quantity: number): Observable<Cart>
  // PATCH /api/cart/items/:itemId
  // Aggiorna cartSubject

removeItem(itemId: number): Observable<Cart>
  // DELETE /api/cart/items/:itemId
  // Aggiorna cartSubject
```

**Pattern:**
- **Single Source of Truth**: `cartSubject` è unica fonte di verità
- **Reactive Programming**: Componenti sottoscrivono a `cart$`
- **Optimistic Updates**: UI aggiorna immediatamente, poi sincronizza backend

#### OrderService

**File**: `core/services/order-service.ts`

**Responsabilità**: Gestione ordini con caching

**Features:**
- **Client-side caching** con TTL di 30 secondi
- **Cache invalidation** dopo creazione ordine
- **Filtri avanzati**

**Struttura cache:**
```typescript
private cache = new Map<string, { data: Order[], timestamp: number }>();
private CACHE_TTL = 30000; // 30 secondi

getOrders(filters?: OrderFilters, forceRefresh = false): Observable<Order[]> {
  const cacheKey = JSON.stringify(filters || {});

  if (!forceRefresh) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return of(cached.data);  // Cache hit
    }
  }

  // Cache miss → fetch da backend
  return this.http.get<Order[]>('/api/orders', { params }).pipe(
    tap(data => this.cache.set(cacheKey, { data, timestamp: Date.now() }))
  );
}

create(order: Order): Observable<Order> {
  return this.http.post<Order>('/api/orders', order).pipe(
    tap(() => this.cache.clear())  // Invalida cache dopo creazione
  );
}
```

#### WishlistService

**File**: `core/services/wishlist.ts`

**Responsabilità**: Gestione wishlist (pattern identico a CartService)

**Metodi:**
```typescript
loadWishlist(): void
addItem(productId: string): Observable<Wishlist>
removeItem(itemId: number): Observable<Wishlist>
```

#### NotificationService

**File**: `core/services/notification.service.ts`

**Responsabilità**: Mostra notifiche toast con Material Snackbar

**Metodi:**
```typescript
showSuccess(message: string, duration = 3000): void
showError(message: string, duration = 5000): void
showInfo(message: string, duration = 3000): void
showWarning(message: string, duration = 4000): void
```

**Implementazione:**
```typescript
showSuccess(message: string, duration: number) {
  this.snackBar.open(message, 'Chiudi', {
    duration,
    horizontalPosition: 'center',
    verticalPosition: 'top',
    panelClass: ['success-snackbar']
  });
}
```

#### LocaleService

**File**: `core/services/locale.service.ts`

**Responsabilità**: Gestione internazionalizzazione (IT/EN)

**Struttura:**
```typescript
languages: Language[] = [
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'en', name: 'English', flag: '🇬🇧' }
];

currentLanguage: Language;  // Basato su LOCALE_ID

switchLanguage(code: string): void {
  localStorage.setItem('preferredLanguage', code);
  // In prod: window.location.reload()
  // In dev: alert per riavviare server con ng serve --configuration=<lang>
}
```

### 4.3 Routing e Guards

**File**: `app/app.routes.ts`

**Configurazione route:**
```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },

  // Public routes
  { path: 'login', loadComponent: () => import('./features/auth/logging-page') },
  { path: 'products', loadComponent: () => import('./features/products/product-page') },
  { path: 'product/:id', component: ProductDetailPage },

  // Protected routes (authGuard)
  { path: 'cart', loadComponent: () => import('./features/cart/cart-page'), canActivate: [authGuard] },
  { path: 'checkout', component: CheckoutPage, canActivate: [authGuard] },
  { path: 'wishlist', loadComponent: () => import('./features/wishlist/wishlist-page'), canActivate: [authGuard] },
  { path: 'user-area', loadComponent: () => import('./features/user-area/user-area-page'), canActivate: [authGuard] }
];
```

**Lazy Loading:**
5 su 8 route utilizzano `loadComponent` per lazy loading → riduce bundle size iniziale

**Auth Guard** (`core/guards/auth.guard.ts`)

```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn) {
    return true;  // Permette accesso
  }

  // Redirect a login
  return router.createUrlTree(['/login']);
};
```

**Utilizzo:**
- Protegge tutte le route che richiedono autenticazione
- Redirect automatico a `/login` se non autenticato
- L'utente viene reindirizzato alla route richiesta dopo login (se implementato)

### 4.4 HTTP Interceptors

**File**: `core/interceptors/auth.interceptor.ts`

**Responsabilità**: Aggiunge token JWT a ogni richiesta

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);  // Nessun token → continua senza header
};
```

**File**: `core/interceptors/error.interceptor.ts`

**Responsabilità**: Gestione centralizzata errori HTTP

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message: string;

      switch (error.status) {
        case 0:
          message = 'Impossibile connettersi al server';
          break;
        case 401:
          // Logout automatico solo se NON è richiesta di login
          if (!req.url.includes('/auth/')) {
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => error);  // No notifica
          }
          message = 'Credenziali non valide';
          break;
        case 403:
          message = 'Non hai i permessi per questa operazione';
          break;
        case 404:
          message = error.error?.error || 'Risorsa non trovata';
          break;
        case 422:
          // Concatena errori di validazione
          message = error.error?.details?.join(', ') || 'Errore di validazione';
          break;
        case 500:
        default:
          message = 'Errore del server';
      }

      notificationService.showError(message);
      return throwError(() => ({ ...error, message }));
    })
  );
};
```

**Registrazione interceptor** (`app.config.ts`):
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    )
  ]
};
```

### 4.5 Modelli TypeScript

**File**: `core/models/*.ts`

```typescript
// user.ts
export interface User {
  id: number;
  email: string;
  createdAt: string;
}

// product.ts
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  sale: boolean;
  thumbnail?: string;
  tags?: string[];
  stock: number;
  createdAt: string;
}

// cart.ts
export interface CartItem {
  id: number;
  cartId: number;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

// order.ts
export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
}

export interface Address {
  street: string;
  city: string;
  zip: string;
}

export interface OrderItem {
  id: number;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: Product;
}

export interface Order {
  id?: number;
  userId?: number;
  customer: Customer;
  address: Address;
  items: Product[] | OrderItem[];
  total: number;
  createdAt: string;
}

// wishlist.ts
export interface WishlistItem {
  id: number;
  wishlistId: number;
  productId: string;
  product: Product;
}

export interface Wishlist {
  id: number;
  userId: number;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}
```

**Naming Convention:**
- **camelCase** (allineato con JavaScript)
- **Typed properties** per type safety
- **Optional properties** con `?` (es. `thumbnail?`, `id?`)

### 4.6 Angular Material

**Moduli Material utilizzati:**

| Categoria | Moduli |
|-----------|--------|
| **Layout** | MatToolbarModule, MatCardModule |
| **Form Controls** | MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatDatepickerModule |
| **Buttons** | MatButtonModule, MatIconModule |
| **Navigation** | MatMenuModule, MatPaginatorModule |
| **Feedback** | MatSnackBarModule, MatProgressSpinnerModule |

**Componenti Material chiave:**

1. **mat-paginator** (ProductPage)
```html
<mat-paginator
  [length]="totalProducts"
  [pageSize]="pageSize"
  [pageSizeOptions]="[10, 20, 50]"
  (page)="onPageChange($event)">
</mat-paginator>
```

2. **mat-form-field** (CheckoutPage)
```html
<mat-form-field appearance="outline">
  <mat-label>Nome</mat-label>
  <input matInput formControlName="firstName" required>
  <mat-error *ngIf="form.get('firstName')?.hasError('required')">
    Campo obbligatorio
  </mat-error>
</mat-form-field>
```

3. **mat-snackbar** (NotificationService)
```typescript
this.snackBar.open(message, 'Chiudi', {
  duration: 3000,
  horizontalPosition: 'center',
  verticalPosition: 'top'
});
```

### 4.7 Reactive Programming con RxJS

**Pattern chiave utilizzati:**

**1. BehaviorSubject per State Management**
```typescript
// CartService
private cartSubject = new BehaviorSubject<Cart | null>(null);
cart$ = this.cartSubject.asObservable();

// Componente
this.cartService.cart$.subscribe(cart => {
  this.cart = cart;
});
```

**2. combineLatest per Filtri Multipli** (ProductPage)
```typescript
filters$ = combineLatest([
  this.searchControl.valueChanges.pipe(startWith(''), debounceTime(300)),
  this.priceMinControl.valueChanges.pipe(startWith(null)),
  this.sortControl.valueChanges.pipe(startWith('date_desc'))
]).pipe(
  distinctUntilChanged(),
  switchMap(([search, priceMin, sort]) =>
    this.productApi.list({ search, priceMin, sort })
  ),
  shareReplay(1)
);
```

**3. switchMap per Route Params** (ProductDetailPage)
```typescript
this.route.paramMap.pipe(
  switchMap(params => {
    const id = params.get('id')!;
    return this.productApi.getById(id);
  })
).subscribe(product => this.product = product);
```

**4. tap per Side Effects**
```typescript
this.http.post('/api/orders', order).pipe(
  tap(() => {
    this.cartService.loadCart();  // Ricarica carrello
    this.cache.clear();           // Invalida cache
  })
);
```

**5. catchError per Error Handling**
```typescript
this.http.get('/api/products').pipe(
  catchError(error => {
    console.error('Errore caricamento prodotti:', error);
    return of([]);  // Fallback con array vuoto
  })
);
```

---

## 5. Flussi Applicativi Principali

### 5.1 Flusso Autenticazione

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Utente apre app → AuthService.loadCurrentUser()          │
│    GET /api/auth/me                                          │
│    - Se 200 → currentUser$ aggiornato                        │
│    - Se 401 → logout e redirect a /login                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Utente clicca "Login" → LoggingPage                      │
│    Form con email/password                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Submit form → AuthService.login(email, password)          │
│    POST /api/auth/login                                      │
│    Body: { email, password }                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend verifica credenziali                              │
│    - User.find_by(email).authenticate(password)              │
│    - Se valide → genera JWT                                  │
│      payload: { user_id, exp: 24h }                          │
│      algoritmo: HS256                                        │
│    - Restituisce { token, user }                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend riceve response                                  │
│    - localStorage.setItem('auth_token', token)               │
│    - currentUser$.next(user)                                 │
│    - Router.navigate(['/products'])                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Ogni richiesta HTTP successiva                            │
│    - AuthInterceptor aggiunge header:                        │
│      Authorization: Bearer <token>                           │
│    - Backend verifica JWT con JwtAuthentication concern      │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Flusso Navigazione Prodotti

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Utente naviga a /products → ProductPage                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Componente inizializza filtri                             │
│    - searchControl = FormControl('')                         │
│    - priceMinControl, priceMaxControl, sortControl           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. combineLatest sui filtri                                  │
│    - debounceTime(300) su search                             │
│    - distinctUntilChanged() per evitare richieste duplicate  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. switchMap → ProductApi.list(filters)                     │
│    GET /api/products?search=...&price_min=...&sort=...       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Backend (ProductsController)                              │
│    products = Product.all                                    │
│    - Se search → WHERE title LIKE '%search%'                 │
│    - Se price_min → WHERE price >= price_min                 │
│    - Se sort → ORDER BY price/created_at                     │
│    - Restituisce JSON array                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Frontend riceve array Product[]                           │
│    - Paginazione client-side (MatPaginator)                  │
│    - Rendering con *ngFor                                    │
│    - ProductCard per ogni prodotto                           │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Flusso Aggiunta al Carrello

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Utente clicca "Aggiungi al carrello"                     │
│    - ProductCard emit evento                                 │
│    - Componente chiama CartService.addItem(productId, qty)  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CartService.addItem()                                     │
│    POST /api/cart/items                                      │
│    Body: { product_id: '123', quantity: 1 }                  │
│    Header: Authorization: Bearer <token>                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend (CartItemsController#create)                     │
│    - Trova cart dell'utente corrente                         │
│    - Trova Product by id                                     │
│    - Verifica stock disponibile                              │
│      if product.stock < quantity → error 422                 │
│    - Cerca CartItem esistente                                │
│      if exists → increment quantity                          │
│      else → crea nuovo CartItem                              │
│    - Restituisce cart completo con items                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend riceve Cart aggiornato                           │
│    - cartSubject.next(cart)                                  │
│    - Header badge aggiorna conteggio                         │
│    - NotificationService.showSuccess()                       │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Flusso Checkout → Ordine

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Utente naviga a /checkout                                 │
│    - authGuard verifica autenticazione                       │
│    - CheckoutPage carica carrello                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Utente compila form                                       │
│    - Reactive Forms con validatori:                          │
│      firstName: [required, minLength(2)]                     │
│      email: [required, pattern(EMAIL_REGEX)]                 │
│      zip: [required, pattern(/^\d{5}$/)]                     │
│    - Checkbox privacy [required]                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Submit form → OrderService.create(order)                  │
│    POST /api/orders                                          │
│    Body: {                                                   │
│      customer: { firstName, lastName, email },               │
│      address: { street, city, zip },                         │
│      items: cart.items,                                      │
│      total: cart.total                                       │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend (OrdersController#create)                        │
│    Transaction START                                         │
│    ├─ Valida stock per ogni prodotto                         │
│    │   if product.stock < quantity → ROLLBACK + error 422    │
│    ├─ Crea Order con customer/address JSON                   │
│    ├─ Per ogni item:                                         │
│    │   ├─ Crea OrderItem (congela unit_price)                │
│    │   └─ Decrementa Product.stock                           │
│    ├─ Svuota Cart.cart_items                                 │
│    └─ COMMIT                                                 │
│    Restituisce Order creato                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend riceve Order                                     │
│    - OrderService invalida cache                             │
│    - CartService.loadCart() (carrello ora vuoto)             │
│    - NotificationService.showSuccess('Ordine creato!')       │
│    - Router.navigate(['/user-area'])                         │
└─────────────────────────────────────────────────────────────┘
```

**Importanza della transazione:**
Se lo stock di anche UN SOLO prodotto è insufficiente durante la creazione, l'intera transazione viene rollbackata → nessun ordine parziale.

### 5.5 Flusso Wishlist

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Utente clicca "Aggiungi ai preferiti" (cuore)            │
│    WishlistService.addItem(productId)                        │
│    POST /api/wishlist/items                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Backend crea WishlistItem                                 │
│    - Verifica duplicati (unique constraint item_id)          │
│    - Restituisce wishlist aggiornata                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. WishlistPage visualizza lista                             │
│    - Sottoscrive a wishlist$                                 │
│    - Mostra prodotti con bottone "Aggiungi al carrello"      │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Sicurezza e Autenticazione

### 6.1 JWT (JSON Web Tokens)

**Struttura JWT:**

Un JWT è composto da tre parti separate da `.`:
```
header.payload.signature
```

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "user_id": 123,
  "exp": 1735862400
}
```

**Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key_base
)
```

**Generazione (Backend):**
```ruby
# AuthController#login
payload = {
  user_id: user.id,
  exp: 24.hours.from_now.to_i
}
token = JWT.encode(payload, Rails.application.secret_key_base, 'HS256')
```

**Verifica (Backend):**
```ruby
# JwtAuthentication concern
def authenticate_user!
  token = request.headers['Authorization']&.split(' ')&.last
  decoded = JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256')
  @current_user = User.find(decoded[0]['user_id'])
rescue JWT::DecodeError, JWT::ExpiredSignature
  render json: { error: 'Invalid or expired token' }, status: :unauthorized
end
```

**Vantaggi JWT:**
- **Stateless**: No sessioni server-side
- **Scalabile**: Backend può essere replicato senza session store condiviso
- **Self-contained**: Token contiene tutte le info necessarie

**Svantaggi:**
- **Non revocabile**: Logout è client-side (rimozione token)
- **Dimensione**: Token più grandi di session ID tradizionale

### 6.2 Password Security

**BCrypt Hash:**
```ruby
# User model
has_secure_password

# Migrazione
add_column :users, :password_digest, :string
```

**Processo:**
1. User registra con password "mypassword123"
2. BCrypt genera salt random
3. BCrypt calcola hash: `$2a$12$random_salt$hashed_password`
4. Hash salvato in `password_digest`

**Verifica:**
```ruby
user = User.find_by(email: 'user@example.com')
user.authenticate('mypassword123')  # true/false
```

**Sicurezza:**
- **Salt casuale** per ogni password
- **Cost factor** (default 12) → computazionalmente costoso per brute force
- **Timing attack resistant**

### 6.3 Protezione Route Frontend

**Auth Guard:**
```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
```

**Applicazione:**
```typescript
{
  path: 'checkout',
  component: CheckoutPage,
  canActivate: [authGuard]  // Richiede autenticazione
}
```

**Nota importante:**
La protezione frontend è **solo UX** → il backend DEVE validare SEMPRE l'autenticazione per ogni richiesta sensibile.

### 6.4 Protezione Route Backend

**Skip autenticazione per route pubbliche:**
```ruby
class ProductsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index, :show]
end
```

**Route protette (default):**
- Tutti i controller ereditano da `ApplicationController`
- `ApplicationController` include `JwtAuthentication`
- `JwtAuthentication` applica `before_action :authenticate_user!`
- Ogni richiesta senza token valido → 401 Unauthorized

### 6.5 CORS (Cross-Origin Resource Sharing)

**Problema:**
Frontend (localhost:4200) e Backend (localhost:3000) sono su porte diverse → browser blocca richieste cross-origin

**Soluzione:**
```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'http://localhost:4200'  # Frontend Angular
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
```

**Headers inviati dal backend:**
```
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD
Access-Control-Allow-Headers: *
```

**Production:**
Cambiare `origins` con dominio production (es. `https://myshop.com`)

### 6.6 Validazioni Input

**Backend validations (ActiveRecord):**
```ruby
validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
validates :price, numericality: { greater_than: 0 }
validates :quantity, numericality: { only_integer: true, greater_than: 0 }
```

**Frontend validations (Reactive Forms):**
```typescript
this.form = this.fb.group({
  firstName: ['', [Validators.required, Validators.minLength(2)]],
  email: ['', [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]],
  zip: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]]
});
```

**Principio:**
- **Frontend validation**: UX rapida, feedback immediato
- **Backend validation**: Sicurezza, source of truth
- **MAI fidarsi solo del frontend** → sempre validare lato server

### 6.7 SQL Injection Prevention

**ActiveRecord automaticamente previene SQL injection:**

**SICURO** (parametrized query):
```ruby
Product.where("title LIKE ?", "%#{search}%")
# SQL: SELECT * FROM products WHERE title LIKE '%laptop%'
```

**PERICOLOSO** (raw SQL):
```ruby
Product.where("title LIKE '%#{params[:search]}%'")
# Se search = "'; DROP TABLE products; --"
# SQL: SELECT * FROM products WHERE title LIKE ''; DROP TABLE products; --'
```

**Best practice:**
Usare SEMPRE metodi ActiveRecord (where, find_by, etc.) che automaticamente escapano i parametri.

### 6.8 Gestione Errori Sicura

**NON esporre stack trace in production:**
```ruby
# config/environments/production.rb
config.consider_all_requests_local = false
```

**Risposta errore generica:**
```json
{
  "error": "Si è verificato un errore. Riprova più tardi."
}
```

**Log dettagliato solo server-side** (non inviato al client)

---

## 7. Funzionalità Avanzate

### 7.1 Storico Ordini Avanzato

**Implementato in:** UserAreaPage + OrdersController

**Features:**

**Backend - Filtri supportati:**
```ruby
def index
  orders = current_user.orders.includes(order_items: :product)

  # Filtro data
  orders = orders.where('created_at >= ?', params[:date_from]) if params[:date_from]
  orders = orders.where('created_at <= ?', params[:date_to]) if params[:date_to]

  # Filtro totale
  orders = orders.where('total >= ?', params[:total_min]) if params[:total_min]
  orders = orders.where('total <= ?', params[:total_max]) if params[:total_max]

  # Ordinamento
  case params[:sort]
  when 'date_asc' then orders.order(created_at: :asc)
  when 'date_desc' then orders.order(created_at: :desc)
  when 'total_asc' then orders.order(total: :asc)
  when 'total_desc' then orders.order(total: :desc)
  else orders.order(created_at: :desc)
  end

  render json: orders
end
```

**Frontend - UserAreaPage:**
```typescript
// Filtri con Reactive Forms
filterForm = this.fb.group({
  dateFrom: [null],
  dateTo: [null],
  totalMin: [null],
  totalMax: [null],
  sort: ['date_desc']
});

loadOrders() {
  const filters: OrderFilters = {
    dateFrom: this.filterForm.value.dateFrom?.toISOString(),
    dateTo: this.filterForm.value.dateTo?.toISOString(),
    totalMin: this.filterForm.value.totalMin,
    totalMax: this.filterForm.value.totalMax,
    sort: this.filterForm.value.sort
  };

  this.orderService.getOrders(filters).subscribe(orders => {
    this.orders = orders;
  });
}
```

**UI:**
- Material DatePicker per selezione date
- Input numerici per totale min/max
- Select per ordinamento
- Dettaglio ordine con espansione (mostra tutti gli item)

**Eager Loading:**
```ruby
orders.includes(order_items: :product)
```
Previene N+1 queries → carica prodotti in una sola query JOIN

### 7.2 Wishlist / Lista Desideri

**Modelli:**
```ruby
class Wishlist < ApplicationRecord
  belongs_to :user
  has_many :wishlist_items, dependent: :destroy
  has_many :products, through: :wishlist_items
end

class WishlistItem < ApplicationRecord
  belongs_to :wishlist
  belongs_to :product, foreign_key: 'item_id'

  validates :item_id, presence: true, uniqueness: { scope: :wishlist_id }
end
```

**API Endpoints:**

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/wishlist` | GET | Ottiene wishlist con prodotti |
| `/api/wishlist/items` | POST | Aggiunge prodotto |
| `/api/wishlist/items/:id` | DELETE | Rimuove prodotto |

**Frontend - WishlistService:**
```typescript
private wishlistSubject = new BehaviorSubject<Wishlist | null>(null);
wishlist$ = this.wishlistSubject.asObservable();

addItem(productId: string): Observable<Wishlist> {
  return this.http.post<Wishlist>(`${this.apiUrl}/wishlist/items`, { product_id: productId }).pipe(
    tap(wishlist => this.wishlistSubject.next(wishlist))
  );
}
```

**UI - WishlistPage:**
- Grid di prodotti preferiti
- Bottone "Aggiungi al carrello" per ogni prodotto
- Bottone "Rimuovi" (icona cuore pieno)
- Sincronizzazione real-time con backend

**Differenza Cart vs Wishlist:**
- **Cart**: Ha quantità e unit_price → finalizzato all'acquisto
- **Wishlist**: Solo lista prodotti → salva per dopo

### 7.3 Internazionalizzazione (i18n)

**Tecnologia:** Angular Localize (built-in)

**Lingue supportate:**
- 🇮🇹 Italiano (default)
- 🇬🇧 English

**Implementazione:**

**1. LocaleService:**
```typescript
export class LocaleService {
  languages: Language[] = [
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  currentLanguage: Language;

  constructor(@Inject(LOCALE_ID) private localeId: string) {
    this.currentLanguage = this.languages.find(l => l.code === localeId) || this.languages[0];
  }

  switchLanguage(code: string): void {
    localStorage.setItem('preferredLanguage', code);
    window.location.reload();  // Ricarica con nuova lingua
  }
}
```

**2. Marker i18n nei template:**
```html
<!-- Semplice -->
<h1 i18n="@@page-title">Prodotti</h1>

<!-- Con contesto -->
<button i18n="@@add-to-cart-button">Aggiungi al carrello</button>

<!-- Attributi -->
<input i18n-placeholder="@@search-placeholder" placeholder="Cerca prodotti...">

<!-- Pluralizzazione -->
<span i18n="@@items-count">
  {itemCount, plural, =0 {Nessun articolo} =1 {1 articolo} other {{{itemCount}} articoli}}
</span>
```

**3. Estrazione e traduzione:**
```bash
# Estrai stringhe traducibili
ng extract-i18n --output-path src/locale

# Genera file messages.xlf
# Traduci manualmente in messages.it.xlf e messages.en.xlf
```

**4. Build per lingua:**
```bash
# Build italiano
ng build --configuration=it

# Build inglese
ng build --configuration=en
```

**5. Configurazione angular.json:**
```json
{
  "projects": {
    "frontend": {
      "i18n": {
        "sourceLocale": "it",
        "locales": {
          "en": "src/locale/messages.en.xlf"
        }
      },
      "architect": {
        "build": {
          "configurations": {
            "it": {
              "localize": ["it"]
            },
            "en": {
              "localize": ["en"]
            }
          }
        }
      }
    }
  }
}
```

**6. Language Selector (Header):**
```html
<button mat-icon-button [matMenuTriggerFor]="langMenu">
  <span class="flag">{{ localeService.currentLanguage.flag }}</span>
</button>
<mat-menu #langMenu="matMenu">
  @for (lang of localeService.languages; track lang.code) {
    <button mat-menu-item (click)="localeService.switchLanguage(lang.code)">
      <span class="flag">{{ lang.flag }}</span>
      {{ lang.name }}
    </button>
  }
</mat-menu>
```

**Vantaggi:**
- **SEO-friendly**: URL diversi per lingua (se configurato)
- **Performance**: Traduzioni compilate in build
- **Type-safe**: Errori di traduzione mancanti a compile-time

---

## 8. Testing

### 8.1 Test Backend (Minitest)

**Framework:** Minitest (default Rails)

**Totale test:** 45 test, 141 assertions, 0 failures

**Categorie:**

**1. Model Tests**

**User Test** (`test/models/user_test.rb`)
```ruby
test "should be valid with email and password" do
  user = User.new(email_address: "test@example.com", password: "password123")
  assert user.valid?
end

test "should require email" do
  user = User.new(password: "password123")
  assert_not user.valid?
  assert_includes user.errors[:email_address], "can't be blank"
end

test "should not allow duplicate emails" do
  User.create!(email_address: "test@example.com", password: "password123")
  user = User.new(email_address: "test@example.com", password: "password456")
  assert_not user.valid?
end

test "should authenticate with correct password" do
  user = User.create!(email_address: "test@example.com", password: "password123")
  assert user.authenticate("password123")
  assert_not user.authenticate("wrongpassword")
end
```

**Product Test** (`test/models/product_test.rb`)
```ruby
test "should require title" do
  product = Product.new(price: 10.0, original_price: 15.0, stock: 5)
  assert_not product.valid?
end

test "should require positive price" do
  product = Product.new(title: "Test", price: -5, stock: 5)
  assert_not product.valid?
end

test "should serialize to camelCase JSON" do
  product = products(:laptop)  # Fixture
  json = product.as_json
  assert_equal product.id, json[:id]
  assert_equal product.title, json[:title]
  assert_equal product.price.to_f, json[:price]
  assert_equal product.created_at.iso8601, json[:createdAt]
end
```

**Cart Test** (`test/models/cart_test.rb`)
```ruby
test "should belong to user" do
  cart = carts(:one)
  assert_respond_to cart, :user
end

test "should destroy cart_items when destroyed" do
  cart = carts(:one)
  assert_difference('CartItem.count', -cart.cart_items.count) do
    cart.destroy
  end
end
```

**2. Controller Tests**

**ProductsController Test** (`test/controllers/api/products_controller_test.rb`)
```ruby
test "should get index" do
  get api_products_url
  assert_response :success
  json = JSON.parse(response.body)
  assert_kind_of Array, json
  assert json.length > 0
end

test "should filter by search" do
  get api_products_url, params: { search: 'laptop' }
  assert_response :success
  json = JSON.parse(response.body)
  json.each do |product|
    assert_match /laptop/i, product['title']
  end
end

test "should filter by price range" do
  get api_products_url, params: { price_min: 500, price_max: 2000 }
  json = JSON.parse(response.body)
  json.each do |product|
    assert product['price'] >= 500
    assert product['price'] <= 2000
  end
end

test "should sort by price ascending" do
  get api_products_url, params: { sort: 'price_asc' }
  json = JSON.parse(response.body)
  prices = json.map { |p| p['price'] }
  assert_equal prices, prices.sort
end

test "should get single product" do
  product = products(:laptop)
  get api_product_url(product)
  assert_response :success
  json = JSON.parse(response.body)
  assert_equal product.id, json['id']
end

test "should return 404 for non-existent product" do
  get api_product_url('nonexistent')
  assert_response :not_found
end
```

**Esecuzione test:**
```bash
# Tutti i test
bin/rails test

# Solo modelli
bin/rails test:models

# Solo controller
bin/rails test:controllers

# Test specifico
bin/rails test test/models/product_test.rb

# In parallelo (più veloce)
bin/rails test --parallel
```

**Fixtures** (`test/fixtures/*.yml`)

Dati di test precaricati:
```yaml
# products.yml
laptop:
  id: "laptop-1"
  title: "Laptop Dell XPS 15"
  price: 1299.99
  original_price: 1599.99
  stock: 10
  sale: true

smartphone:
  id: "phone-1"
  title: "iPhone 15 Pro"
  price: 999.99
  original_price: 999.99
  stock: 25
  sale: false
```

### 8.2 Test Frontend (Angular)

**Framework:** Jasmine + Karma (default Angular)

**Struttura:**
```
src/app/
├── features/
│   └── products/
│       └── product-page/
│           ├── product-page.component.ts
│           └── product-page.component.spec.ts  ← Test file
```

**Esempio test componente:**
```typescript
describe('ProductPageComponent', () => {
  let component: ProductPageComponent;
  let fixture: ComponentFixture<ProductPageComponent>;
  let productApiSpy: jasmine.SpyObj<ProductApi>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ProductApi', ['list']);

    await TestBed.configureTestingModule({
      imports: [ProductPageComponent],
      providers: [
        { provide: ProductApi, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductPageComponent);
    component = fixture.componentInstance;
    productApiSpy = TestBed.inject(ProductApi) as jasmine.SpyObj<ProductApi>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    const mockProducts: Product[] = [
      { id: '1', title: 'Product 1', price: 10, ... },
      { id: '2', title: 'Product 2', price: 20, ... }
    ];
    productApiSpy.list.and.returnValue(of(mockProducts));

    component.ngOnInit();

    expect(productApiSpy.list).toHaveBeenCalled();
  });
});
```

**Esempio test servizio:**
```typescript
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();  // Verifica nessuna richiesta pending
  });

  it('should login and save token', () => {
    const mockResponse = {
      token: 'fake-jwt-token',
      user: { id: 1, email: 'test@example.com' }
    };

    service.login('test@example.com', 'password').subscribe(user => {
      expect(user).toEqual(mockResponse.user);
      expect(localStorage.getItem('auth_token')).toBe('fake-jwt-token');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
```

**Esecuzione:**
```bash
# Esegui test
npm test

# Test in watch mode
npm test -- --watch

# Test con coverage
npm test -- --code-coverage
```

---

## 9. Deployment e Docker

### 9.1 Docker Setup

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - bundle_cache:/usr/local/bundle
    environment:
      - RAILS_ENV=development
      - DATABASE_URL=sqlite3:db/development.sqlite3
    command: bin/rails server -b 0.0.0.0

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "4200:4200"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm start

volumes:
  bundle_cache:
```

**Backend Dockerfile.dev:**
```dockerfile
FROM ruby:3.4.7

WORKDIR /app

# Installa dipendenze sistema
RUN apt-get update -qq && apt-get install -y \
  build-essential \
  libsqlite3-dev \
  nodejs

# Copia Gemfile
COPY Gemfile Gemfile.lock ./
RUN bundle install

# Copia app
COPY . .

EXPOSE 3000

CMD ["bin/rails", "server", "-b", "0.0.0.0"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:20

WORKDIR /app

# Copia package.json
COPY package*.json ./
RUN npm install

# Copia app
COPY . .

EXPOSE 4200

CMD ["npm", "start"]
```

### 9.2 Comandi Docker

**Setup iniziale:**
```bash
# Build e avvia container
docker-compose up -d --build

# Setup database backend
docker exec esamesistemiweb-backend-1 bin/rails db:create
docker exec esamesistemiweb-backend-1 bin/rails db:migrate
docker exec esamesistemiweb-backend-1 bin/rails db:seed

# Installa dipendenze frontend
docker exec esamesistemiweb-frontend-1 npm install
```

**Comandi quotidiani:**
```bash
# Avvia
docker-compose up

# Avvia in background
docker-compose up -d

# Ferma
docker-compose down

# Vedi log
docker-compose logs -f

# Log specifico servizio
docker-compose logs -f backend

# Ricostruisci dopo modifiche Dockerfile
docker-compose up --build

# Rimuovi volumi (cancella DB!)
docker-compose down -v
```

### 9.3 Setup Manuale (senza Docker)

**Backend:**
```bash
cd backend

# Installa Ruby 3.4.7 (rbenv/rvm)
rbenv install 3.4.7
rbenv local 3.4.7

# Installa dipendenze
bundle install

# Setup DB
bin/rails db:create
bin/rails db:migrate
bin/rails db:seed

# Avvia server
bin/dev  # o bin/rails server
```

**Frontend:**
```bash
cd frontend

# Installa Node 20.x (nvm)
nvm install 20
nvm use 20

# Installa dipendenze
npm install

# Avvia server dev
npm start  # o ng serve
```

**URL:**
- Backend: http://localhost:3000
- Frontend: http://localhost:4200

### 9.4 Database Seed

**File:** `backend/db/seeds.rb`

Popola database con dati di esempio:
```ruby
# Crea utente di test
User.create!(
  email_address: 'test@example.com',
  password: 'password123'
)

# Crea prodotti
products = [
  {
    id: 'laptop-1',
    title: 'Laptop Dell XPS 15',
    description: 'Potente laptop per sviluppatori',
    price: 1299.99,
    original_price: 1599.99,
    sale: true,
    stock: 10,
    tags: ['elettronica', 'computer']
  },
  {
    id: 'phone-1',
    title: 'iPhone 15 Pro',
    description: 'Ultimo modello Apple',
    price: 999.99,
    original_price: 999.99,
    sale: false,
    stock: 25,
    tags: ['elettronica', 'smartphone']
  }
]

products.each { |p| Product.create!(p) }

puts "Seeding completato: #{User.count} utenti, #{Product.count} prodotti"
```

**Esecuzione:**
```bash
bin/rails db:seed
```

---

## 10. Verifica Conformità alle Specifiche

### Checklist Requisiti Obbligatori

#### 4.1 Gestione Prodotti
- ✅ GET /products con elenco prodotti
- ✅ Supporto filtri:
  - ✅ Ricerca testuale (?q=...)
  - ✅ Filtro per categoria/tag (via search)
  - ✅ Paginazione (client-side con MatPaginator)
  - ✅ **BONUS**: Range prezzo (?price_min, ?price_max)
  - ✅ **BONUS**: Ordinamento (?sort=price_asc/desc/date_asc/desc)
- ✅ GET /products/:id con dettaglio
- ✅ ProductService usa endpoint REST reali
- ✅ Nessun dato hardcoded

#### 4.2 Carrello Persistente
- ✅ Modello Cart associato a User
- ✅ Modello CartItem con Product, quantity, unit_price
- ✅ GET /cart
- ✅ POST /cart/items
- ✅ PATCH /cart/items/:id
- ✅ DELETE /cart/items/:id
- ✅ CartService sincronizza backend
- ✅ Carrello persiste al reload
- ⚠️ Carrello guest: NON IMPLEMENTATO (sarebbe un plus)

#### 4.3 Checkout e Ordini
- ✅ Modello Order con customer, address (JSON), total, date
- ✅ Modello OrderItem con product, quantity, unit_price
- ✅ POST /orders crea ordine e svuota carrello
- ✅ GET /orders restituisce lista ordini utente
- ✅ GET /orders/:id dettaglio ordine
- ✅ OrderService invia dati checkout
- ✅ Feedback UI (loading, success, error)
- ✅ Pagina lista ordini (UserAreaPage)

#### 4.4 Autenticazione
- ✅ POST /auth/login con JWT
- ✅ POST /auth/logout
- ✅ GET /auth/me
- ✅ **BONUS**: POST /auth/register
- ✅ Pagina login con form
- ✅ Token storage (localStorage)
- ✅ HttpInterceptor per Authorization header
- ✅ Route guards (authGuard)

#### 5. Requisiti Tecnici Backend
- ✅ Rails API mode (--api)
- ✅ Database relazionale (SQLite3)
- ✅ Validazioni modelli (presence, numericality, uniqueness, format)
- ✅ Gestione errori HTTP (400, 401, 404, 422, 500)
- ✅ Test minimi:
  - Richiesto: 1 test modello + 1 test controller
  - **IMPLEMENTATO: 45 test, 141 assertions** ✅✅✅

#### 6. Requisiti Tecnici Frontend
- ✅ Nessun dato hardcoded
- ✅ Servizi dedicati (AuthService, ProductApi, CartService, OrderService, WishlistService)
- ✅ Reactive Forms per checkout
- ✅ HttpClient
- ✅ HttpInterceptor (authInterceptor, errorInterceptor)

#### 7. Funzionalità Avanzate (minimo 1)
Richiesto: 1 funzionalità avanzata
**IMPLEMENTATO: 3 funzionalità** ✅✅✅

1. ✅ **Storico ordini avanzato**
   - Pagina "I miei ordini" con filtri per data/totale
   - Dettaglio ordine completo
   - Ordinamento personalizzabile

2. ✅ **Wishlist**
   - Modello backend con persistenza
   - API completa (GET, POST, DELETE)
   - UI dedicata (WishlistPage)
   - Sincronizzazione real-time

3. ✅ **Internazionalizzazione**
   - Supporto IT + EN
   - Angular Localize
   - Language selector con flag
   - Traduzioni compilate

#### 8. Consegna
- ✅ Repository Git
- ✅ README con:
  - ✅ Prerequisiti software
  - ✅ Istruzioni setup database
  - ✅ Istruzioni avvio backend/frontend
  - ✅ Descrizione funzionalità
- ✅ **BONUS**: docker-compose.yml

### Riepilogo

**Requisiti obbligatori:** 100% implementati ✅
**Funzionalità avanzate:** 3 su 1 richiesto (300%) ✅✅✅
**Test:** 45 test vs 2 richiesti (2250%) ✅✅✅
**Docker:** Implementato (opzionale) ✅
**Registrazione utenti:** Implementata (non richiesta) ✅

**Valutazione attesa:** 28-30/30 (con possibilità di lode per 3 funzionalità avanzate + testing esteso)

---

## 11. Domande Frequenti per la Discussione Orale

### Domande su Architettura

**Q: Perché hai scelto un'architettura REST invece di GraphQL?**

A: REST è più semplice per un e-commerce tradizionale. Con GraphQL avremmo avuto flessibilità nelle query, ma per questo progetto le endpoint REST sono sufficienti e ben definite. REST è anche più facile da cachare lato client.

**Q: Come gestisci lo stato dell'applicazione nel frontend?**

A: Uso **BehaviorSubject di RxJS** per state management nei servizi (CartService, WishlistService, AuthService). È più leggero di NgRx per un'app di questa dimensione. I componenti si sottoscrivono agli Observable esposti dai servizi.

**Q: Perché hai usato SQLite invece di PostgreSQL?**

A: SQLite è perfetto per sviluppo e demo. È zero-configuration e file-based. Per production userei PostgreSQL per:
- Concorrenza migliore
- Supporto JSON nativo
- Scalabilità

### Domande su Sicurezza

**Q: Il JWT è sicuro? Come previeni attacchi?**

A: Sicurezza JWT:
1. **HTTPS in production** → previene man-in-the-middle
2. **Scadenza 24h** → limita esposizione se rubato
3. **Secret key sicura** → Rails.application.secret_key_base
4. **HttpOnly cookie** (alternative) → previene XSS (non implementato, ma meglio di localStorage)

Limiti:
- JWT non è revocabile → logout solo client-side
- Se rubato, valido fino a scadenza

**Q: Come previeni SQL injection?**

A: ActiveRecord automaticamente parameterizza le query:
```ruby
# SICURO
Product.where("title LIKE ?", "%#{search}%")

# PERICOLOSO (mai usato)
Product.where("title LIKE '%#{search}%'")
```
Uso sempre metodi ActiveRecord (where, find_by), mai raw SQL con interpolazione.

**Q: Le password sono sicure?**

A: Sì, uso BCrypt tramite `has_secure_password`:
- Salt casuale per ogni password
- Cost factor 12 (computazionalmente costoso)
- Hash one-way (irreversibile)
- Timing attack resistant

### Domande su Performance

**Q: Come gestisci il problema delle N+1 queries?**

A: Uso **eager loading** con `includes`:
```ruby
Order.includes(order_items: :product)
```
Invece di:
- 1 query per ordini
- N query per order_items
- M query per products

Faccio:
- 1 query per ordini
- 1 JOIN query per order_items + products

**Q: Hai implementato caching?**

A: Sì, in OrderService:
- **Client-side cache** con TTL 30 secondi
- **Cache invalidation** dopo POST /orders
- **forceRefresh** per bypass manuale

Per production, aggiungerei:
- Redis per cache backend
- HTTP caching headers (ETag, Cache-Control)

**Q: La paginazione è lato client o server?**

A: **Client-side** con MatPaginator. Per production con migliaia di prodotti, implementerei paginazione server-side:
```ruby
# Backend
products = Product.page(params[:page]).per(params[:per_page])

# Frontend
?page=2&per_page=20
```

### Domande su Testing

**Q: Che tipi di test hai implementato?**

A: **Backend (Minitest)**:
- **Model tests**: Validazioni, relazioni, metodi custom
- **Controller tests**: Endpoint API, filtri, ordinamento, autenticazione

**Frontend (Jasmine)**:
- **Component tests**: Rendering, interazioni, binding
- **Service tests**: HTTP mocking, business logic

**Coverage:** 45 test backend, 141 assertions

**Q: Come testi l'autenticazione?**

A: Backend:
```ruby
test "should require authentication" do
  get api_cart_url
  assert_response :unauthorized
end

test "should allow access with valid token" do
  user = users(:one)
  token = generate_jwt_for(user)
  get api_cart_url, headers: { Authorization: "Bearer #{token}" }
  assert_response :success
end
```

Frontend:
```typescript
it('should redirect to login if not authenticated', () => {
  spyOn(authService, 'isLoggedIn').and.returnValue(false);
  const result = authGuard();
  expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
});
```

### Domande su Flussi

**Q: Descrivi il flusso completo di checkout → ordine**

A:
1. Utente compila form checkout (Reactive Forms)
2. Submit → `OrderService.create(order)`
3. POST /api/orders con customer, address, items, total
4. Backend:
   a. Valida stock per ogni prodotto
   b. Inizia transazione DB
   c. Crea Order
   d. Crea OrderItems (congela unit_price)
   e. Decrementa stock prodotti
   f. Svuota Cart
   g. Commit transazione
5. Frontend:
   a. Invalida cache OrderService
   b. Ricarica carrello (ora vuoto)
   c. Mostra notifica successo
   d. Redirect a /user-area

**Q: Cosa succede se lo stock è insufficiente durante l'ordine?**

A: La transazione viene **rollbackata completamente**:
```ruby
ActiveRecord::Base.transaction do
  items.each do |item|
    if product.stock < item[:quantity]
      raise ActiveRecord::Rollback  # Annulla tutto
    end
    # ...
  end
end
```
Risposta: 422 Unprocessable Entity con messaggio errore.
Frontend mostra notifica: "Stock insufficiente per Prodotto X"

### Domande su Angular

**Q: Perché usi Reactive Forms invece di Template-driven?**

A: Reactive Forms per:
- **Type safety** (TypedForms in Angular 14+)
- **Testabilità** (logic in TypeScript)
- **Validazione complessa** (custom validators, cross-field)
- **Reattività** (valueChanges Observable)

Template-driven è più semplice ma meno potente.

**Q: Cosa fa HttpInterceptor?**

A: Intercetta TUTTE le richieste HTTP:

**authInterceptor:**
- Legge token da localStorage
- Aggiunge header Authorization: Bearer <token>
- Automatizza autenticazione

**errorInterceptor:**
- Cattura errori HTTP centralizzati
- Gestione 401 → logout automatico
- Mostra notifiche errore
- Normalizza formato errori

**Q: Come funziona il lazy loading?**

A:
```typescript
{
  path: 'cart',
  loadComponent: () => import('./features/cart/cart-page')
}
```
- Codice CartPage NON incluso in bundle iniziale
- Caricato solo quando utente naviga a /cart
- Riduce dimensione bundle iniziale → app più veloce

### Domande su Rails

**Q: Cos'è API mode in Rails?**

A: `rails new --api` disabilita:
- Views (ERB templates)
- Assets pipeline
- Middleware per sessions/cookies
- Helpers per HTML

Lascia solo:
- Controllers (JSON response)
- Models
- Middleware essenziali

Risultato: App più leggera per API pure.

**Q: Come gestisci CORS?**

A: Rack::Cors middleware:
```ruby
allow do
  origins 'http://localhost:4200'  # Frontend
  resource '*', headers: :any, methods: [:get, :post, :put, :patch, :delete]
end
```
Permette frontend su porta diversa di chiamare API.

**Q: Perché hai usato JSON per customer e address invece di tabelle separate?**

A: Trade-off:

**Vantaggi JSON:**
- Flessibilità (campi dinamici)
- No JOIN query
- Meno tabelle

**Svantaggi:**
- Non queryabile facilmente
- No validazioni schema DB
- Meno normalizzato

Per questo progetto, customer/address sono dati "snapshot" al momento dell'ordine → JSON appropriato.

---

## Conclusione

Questo progetto dimostra competenze complete in:

**Backend:**
- Progettazione API REST
- Modellazione dati relazionale
- Autenticazione JWT
- Gestione transazioni
- Testing automatizzato

**Frontend:**
- Architettura component-based
- State management reattivo
- Routing e guards
- HTTP interceptors
- Material Design

**DevOps:**
- Docker containerization
- Environment configuration

**Sicurezza:**
- Password hashing
- Token authentication
- Input validation
- CORS configuration

**Best Practices:**
- DRY (Don't Repeat Yourself)
- Separation of concerns
- Error handling
- Type safety
- Testing

Preparati a discutere scelte architetturali, trade-off, e possibili miglioramenti futuri (scalabilità, caching, ottimizzazioni).

**Buona fortuna con l'esame!** 🚀
