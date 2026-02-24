# Shop Online - Progetto Sistemi Web AA 2025/2026

Applicazione web full-stack per e-commerce sviluppata con Angular (frontend) e Ruby on Rails (backend).

## Indice

- [Informazioni Generali](#informazioni-generali)
- [Tecnologie Utilizzate](#tecnologie-utilizzate)
- [Prerequisiti](#prerequisiti)
- [Setup con Docker (Raccomandato)](#setup-con-docker-raccomandato)
- [Setup Manuale](#setup-manuale)
- [Struttura del Progetto](#struttura-del-progetto)
- [Funzionalità Implementate](#funzionalità-implementate)
- [API Endpoints](#api-endpoints)
- [Modello Dati](#modello-dati)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Informazioni Generali

Questo progetto è un'applicazione web full-stack di shop online che permette agli utenti di:
- Navigare un catalogo di prodotti con filtri e ricerca
- Gestire un carrello persistente
- Effettuare ordini tramite un sistema di checkout
- Visualizzare lo storico degli ordini
- Autenticarsi tramite sistema di login sicuro

### Tipologia
Progetto individuale full-stack (frontend + backend)

### Anno Accademico
2025/2026 - Corso di Sistemi Web

## Tecnologie Utilizzate

### Frontend
- **Angular**: 21.0.0
- **TypeScript**: 5.9.2
- **Angular Material**: 21.0.0 (UI Components)
- **RxJS**: 7.8.0 (Reactive Programming)

### Backend
- **Ruby**: 3.4.7
- **Ruby on Rails**: 8.1.1 (API mode)
- **Database**: SQLite3
- **Autenticazione**: JWT (JSON Web Tokens) + BCrypt

### DevOps
- **Docker** & **Docker Compose**
- **Node.js**: 20.x
- **npm**: 10.9.4

## Prerequisiti

### Opzione 1: Con Docker (Raccomandato)
- Docker Engine 20.10+
- Docker Compose 2.0+

### Opzione 2: Setup Manuale
- Ruby 3.4.7
- Rails 8.1.1
- Node.js 20.x
- npm 10.9.4
- SQLite3
- Git

## Setup con Docker (Raccomandato)

Il modo più semplice e veloce per avviare l'applicazione è utilizzare Docker Compose.

### 1. Clona il repository

```bash
git clone <url-repository>
cd EsameSistemiWeb
```

### 2. Inizializza i submoduli (se presenti)

```bash
git submodule update --init --recursive
```

### 3. Avvia i container

```bash
docker compose up -d --build
```

Questo comando:
- Costruirà le immagini Docker per backend e frontend
- Installerà tutte le dipendenze
- Avvierà i servizi su:
  - **Backend**: http://localhost:3000
  - **Frontend**: http://localhost:4200

### 4. Setup del Database (Prima esecuzione)

In un nuovo terminale, esegui:

```bash

# Crea il database
docker exec esamesistemiweb-backend-1 bin/rails db:create

# Esegui le migrazioni
docker exec esamesistemiweb-backend-1 bin/rails db:migrate

# (Opzionale) Popola il database con dati di esempio
docker exec esamesistemiweb-backend-1 bin/rails db:seed

# Installa npm nel frontend
docker exec esamesistemiweb-frontend-1 npm install

# Chiudi tutti i container
docker compose down
```

### 5. Accedi all'applicazione
```bash
# Lancia i container
docker compose up
```
Apri il browser e vai su: **http://localhost:4200**

### Comandi Docker Utili

```bash
# Fermare i container
docker-compose down

# Riavviare i container
docker-compose restart

# Vedere i log
docker-compose logs -f

# Vedere i log solo del backend
docker-compose logs -f backend

# Vedere i log solo del frontend
docker-compose logs -f frontend

# Ricostruire i container dopo modifiche al Dockerfile
docker-compose up --build

# Rimuovere volumi (attenzione: cancella il database!)
docker-compose down -v
```

<span style="color:red">**Per eventuali problemi nel setup dell'applicazione tramite docker compose si consiglia di fare riferimento alla sezione "Troubleshooting" di questo documento, se i problemi persistono si consiglia il setup manuale dell'ambiente**</span>

## Setup Manuale

Se preferisci non usare Docker, segui questi passaggi:

### Backend Setup

```bash
# Entra nella directory backend
cd backend

# Installa le dipendenze Ruby
bundle install

# Setup del database
bin/rails db:create
bin/rails db:migrate
bin/rails db:seed  # Opzionale: dati di esempio

# Avvia il server Rails
bin/dev
```

Il backend sarà disponibile su http://localhost:3000

### Frontend Setup

In un nuovo terminale:

```bash
# Entra nella directory frontend
cd frontend

# Installa le dipendenze Node
npm install

# Avvia il server di sviluppo Angular
npm start
```

Il frontend sarà disponibile su http://localhost:4200

## Struttura del Progetto

```
EsameSistemiWeb/
├── backend/                    # Applicazione Ruby on Rails (API)
│   ├── app/
│   │   ├── controllers/       # Controller REST API
│   │   ├── models/            # Modelli ActiveRecord
│   │   ├── serializers/       # Serializzatori JSON
│   │   └── services/          # Business logic
│   ├── config/                # Configurazione Rails
│   ├── db/
│   │   ├── migrate/           # Migrazioni database
│   │   └── seeds.rb           # Dati iniziali
│   ├── spec/                  # Test RSpec
│   ├── Dockerfile             # Dockerfile produzione
│   ├── Dockerfile.dev         # Dockerfile sviluppo
│   └── Gemfile                # Dipendenze Ruby
│
├── frontend/                  # Applicazione Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core           # Core module
│   |   |   │   ├── guard
│   |   |   │   ├── interceptors
│   |   |   │   ├── models
│   |   |   │   └── services
│   |   |   ├── features       # Componenti
│   |   |   │   ├── auth
│   |   |   │   │   ├── logging-page
│   |   |   │   │   └── register-page
│   |   |   │   ├── cart
│   |   |   │   │   └── cart-page
│   |   |   │   ├── checkout
│   |   |   │   │   └── checkout-page
│   |   |   │   ├── products
│   |   |   │   │   ├── product-card
│   |   |   │   │   ├── product-detail-page
│   |   |   │   │   └── product-page
│   |   |   │   ├── user-area
│   |   |   │   │   └── user-area-page
│   |   |   │   └── wishlist
│   |   |   │       └── wishlist-page
│   |   |   ├── shared        # Parti condivise
│   |   |   |   └── header
│   │   │   └── app.routes.ts # Routing
│   │   └── main.ts           # Bootstrap application
│   ├── Dockerfile            # Dockerfile sviluppo
│   ├── angular.json          # Configurazione Angular
│   └── package.json          # Dipendenze Node
│
├── docker-compose.yml        # Orchestrazione Docker
└── README.md                 # Questo file
```

## Funzionalità Implementate

### Funzionalità Obbligatorie

#### 1. Gestione Prodotti
- ✅ Visualizzazione catalogo prodotti
- ✅ Dettaglio prodotto
- ✅ Filtro per categoria/tag
- ✅ Ricerca testuale
- ✅ Paginazione risultati

#### 2. Carrello Persistente
- ✅ Carrello salvato sul backend
- ✅ Aggiunta/rimozione prodotti
- ✅ Modifica quantità
- ✅ Persistenza tra sessioni
- ✅ Sincronizzazione real-time con backend

#### 3. Checkout e Ordini
- ✅ Form di checkout con Reactive Forms
- ✅ Validazioni client-side e server-side
- ✅ Creazione ordine dal carrello
- ✅ Visualizzazione lista ordini
- ✅ Dettaglio singolo ordine
- ✅ Gestione stati ordine

#### 4. Autenticazione
- ✅ Sistema di login con credenziali
- ✅ JWT Token per autenticazione
- ✅ Password criptate con BCrypt
- ✅ Route Guards per protezione rotte
- ✅ HTTP Interceptor per token injection
- ✅ Logout e gestione sessione

### Funzionalità Avanzate


- ✅ Storico ordini avanzato
- ✅ Wishlist
- ✅ Internazionalizzazione (i18n)

## API Endpoints

### Autenticazione

| Metodo | Endpoint | Descrizione | Autenticazione |
|--------|----------|-------------|----------------|
| POST | `/auth/login` | Login utente | No |
| POST | `/auth/logout` | Logout utente | Sì |
| GET | `/auth/me` | Dati utente corrente | Sì |
| POST | `/auth/signup` | Registrazione nuovo utente | No |

### Prodotti

| Metodo | Endpoint | Descrizione | Autenticazione |
|--------|----------|-------------|----------------|
| GET | `/products` | Lista prodotti (con filtri, ricerca, paginazione) | No |
| GET | `/products/:id` | Dettaglio prodotto | No |

Query parameters per `/products`:
- `?q=testo` - Ricerca testuale
- `?tag=categoria` - Filtro per categoria
- `?page=1&per_page=20` - Paginazione

### Carrello

| Metodo | Endpoint | Descrizione | Autenticazione |
|--------|----------|-------------|----------------|
| GET | `/cart` | Stato carrello corrente | Sì |
| POST | `/cart/items` | Aggiungi prodotto al carrello | Sì |
| PATCH | `/cart/items/:id` | Modifica quantità | Sì |
| DELETE | `/cart/items/:id` | Rimuovi prodotto dal carrello | Sì |

### Ordini

| Metodo | Endpoint | Descrizione | Autenticazione |
|--------|----------|-------------|----------------|
| GET | `/orders` | Lista ordini utente | Sì |
| GET | `/orders/:id` | Dettaglio ordine | Sì |
| POST | `/orders` | Crea nuovo ordine | Sì |

## Modello Dati

### Principali Entità

#### User
```ruby
- id: integer
- email: string
- password_digest: string (BCrypt)
- created_at: datetime
- updated_at: datetime
```

#### Product
```ruby
- id: integer
- name: string
- description: text
- price: decimal
- category: string
- image_url: string
- stock: integer
- created_at: datetime
- updated_at: datetime
```

#### Cart
```ruby
- id: integer
- user_id: integer (foreign key)
- created_at: datetime
- updated_at: datetime
```

#### CartItem
```ruby
- id: integer
- cart_id: integer (foreign key)
- product_id: integer (foreign key)
- quantity: integer
- unit_price: decimal
- created_at: datetime
- updated_at: datetime
```

#### Order
```ruby
- id: integer
- user_id: integer (foreign key)
- total: decimal
- status: string (pending, confirmed, shipped, delivered, cancelled)
- shipping_name: string
- shipping_address: string
- shipping_city: string
- shipping_zip: string
- created_at: datetime
- updated_at: datetime
```

#### OrderItem
```ruby
- id: integer
- order_id: integer (foreign key)
- product_id: integer (foreign key)
- quantity: integer
- unit_price: decimal (prezzo al momento dell'ordine)
- created_at: datetime
- updated_at: datetime
```

### Relazioni
- User `has_one` Cart
- User `has_many` Orders
- Cart `has_many` CartItems
- Cart `has_many` Products through CartItems
- Order `has_many` OrderItems
- Order `has_many` Products through OrderItems
- Product `has_many` CartItems
- Product `has_many` OrderItems

## Testing

### Backend (Rails)

Il backend utilizza **Minitest**, il framework di testing nativo di Rails.

```bash
# Entra nel container backend (se usi Docker)
docker-compose exec backend bash

# Oppure dalla directory backend/ (setup manuale)

# Esegui tutti i test
bin/rails test

# Esegui solo i test dei modelli
bin/rails test:models

# Esegui solo i test dei controller
bin/rails test:controllers

# Esegui un test specifico
bin/rails test test/models/product_test.rb

# Esegui i test in parallelo (più veloce)
bin/rails test --parallel
```

Test implementati:

- ✅ **Product**: validazioni (title, price, original_price, stock), metodo as_json, relazioni con OrderItem
- ✅ **User**: validazioni (email_address), autenticazione con password sicura, relazioni con Cart e Orders
- ✅ **Cart**: validazioni, relazioni con User e CartItems, dependent destroy
- ✅ **ProductsController**: API endpoints (index, show), filtri (search, price range), ordinamento (price, date), paginazione

Totale: **45 test**, **141 asserzioni**, **0 failures**, **0 errors**

### Frontend (Angular)

```bash
# Entra nel container frontend (se usi Docker)
docker-compose exec frontend bash

# Oppure dalla directory frontend/ (setup manuale)

# Esegui i test unitari
npm test
```

## Flusso Applicativo

### 1. Autenticazione
```
Utente → Login → Backend (verifica credenziali) → JWT Token → Frontend (storage + interceptor)
```

### 2. Navigazione Prodotti
```
Frontend → GET /products → Backend → DB → JSON Response → Angular (visualizzazione)
```

### 3. Carrello
```
Frontend (add to cart) → POST /cart/items → Backend (crea CartItem) → DB → Response → Frontend (aggiorna UI)
```

### 4. Checkout → Ordine
```
Frontend (checkout form) → POST /orders → Backend (crea Order + OrderItems, svuota Cart) → DB → Response → Frontend (conferma)
```

## Troubleshooting

### Problema: Il backend non si avvia

**Soluzione**:

```bash
docker-compose down
docker-compose up --build backend
```

### Problema: Errori di permessi sui volumi Docker

**Soluzione**:

```bash
sudo usermod -aG docker $USER
newgrp docker

docker compose up -d --build
```

### Problema: Il database non esiste

**Soluzione**:

```bash
docker-compose exec backend rails db:create db:migrate
```

### Problema: CORS errors nel browser

**Soluzione**: Verifica che il backend abbia configurato correttamente CORS in `config/initializers/cors.rb`

### Problema: Errore "Cannot find module" in Angular

**Soluzione**:

```bash
docker-compose down
docker-compose up --build frontend
```

### Problema: Le modifiche al codice non si riflettono

**Backend**:

```bash
docker-compose restart backend
```

**Frontend**: Il server Angular dovrebbe ricaricare automaticamente. Se non funziona:

```bash
docker-compose restart frontend
```

## Licenza

Progetto sviluppato per scopi didattici - AA 2025/2026
