# Shop Online — Progetto Ingegneria del Software Avanzata, AA 2025/2026

Applicazione web full-stack di e-commerce, sviluppata come progetto
individuale per il corso di Ingegneria del Software Avanzata (Università
di Ferrara, CdLM Ingegneria Informatica e dell'Automazione).

Il documento [SPECIFICHE.md](SPECIFICHE.md) descrive **cosa** fa il
sistema, per chi è pensato e i vincoli che hanno guidato le scelte
progettuali. Il presente README descrive **come** installarlo,
avviarlo, testarlo e mantenerlo.

## Indice

- [Stack tecnologico](#stack-tecnologico)
- [Prerequisiti](#prerequisiti)
- [Setup con Docker](#setup-con-docker)
- [Setup manuale](#setup-manuale)
- [Struttura del progetto](#struttura-del-progetto)
- [API Endpoints](#api-endpoints)
- [Modello dati](#modello-dati)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Troubleshooting](#troubleshooting)

## Stack tecnologico

### Frontend

- **Angular** 21 + **TypeScript** 5.9
- **Angular Material** 21 per i componenti UI
- **RxJS** 7.8 per la programmazione reattiva
- **Vitest** 4 per i test unitari, **Playwright** 1.61 per i test E2E

### Backend

- **Ruby** 3.4 + **Ruby on Rails** 8.1 (modalità API)
- **SQLite** 3 come database
- **JWT** (HS256) + **BCrypt** per autenticazione e gestione password
- **Minitest** per i test (con SimpleCov per la coverage, Rantly per i
  test property-based)

### DevOps

- **Docker** + **Docker Compose** per il deployment locale e di
  produzione
- **GitHub Actions** per la pipeline CI/CD
- **GitHub Container Registry (GHCR)** per la pubblicazione delle
  immagini al rilascio

## Prerequisiti

### Setup con Docker (raccomandato)

- Docker Engine 20.10+
- Docker Compose v2+

### Setup manuale (alternativa)

- Ruby 3.4 (con bundler)
- Node.js 20.x con npm 10.9+
- SQLite 3
- Git

## Setup con Docker

```bash
git clone <url-repository>
cd ProgettoEsame
docker compose up -d --build
```

Alla prima esecuzione bisogna preparare il database e installare le
dipendenze frontend:

```bash
docker compose exec backend bin/rails db:create db:migrate db:seed
docker compose exec frontend npm install --legacy-peer-deps
```

L'applicazione è ora disponibile su:

- Frontend: <http://localhost:4200>
- Backend (API): <http://localhost:3000/api>

Per i comandi successivi:

```bash
docker compose up -d           # avvia in background
docker compose down            # ferma e rimuove i container
docker compose logs -f         # segue i log di tutti i servizi
docker compose logs -f backend # solo backend
docker compose restart         # riavvia
docker compose down -v         # rimuove anche i volumi (cancella il DB!)
```

> Il flag `--legacy-peer-deps` su `npm install` è necessario perché
> alcune dipendenze Angular 21 hanno peer ranges non ancora aggiornate.

## Setup manuale

In alternativa al Docker, l'applicazione può essere avviata direttamente
sul sistema.

### Backend

```bash
cd backend
bundle install
bin/rails db:create db:migrate db:seed
bin/rails server
```

Il backend è in ascolto su <http://localhost:3000>.

### Frontend

In un nuovo terminale:

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

Il frontend è in ascolto su <http://localhost:4200>.

## Struttura del progetto

```
ProgettoEsame/
├── README.md                 # Questo file (operativo)
├── SPECIFICHE.md             # Documento di specifica (concettuale)
├── docker-compose.yml        # Orchestrazione locale dei container
│
├── backend/                  # Applicazione Ruby on Rails (API)
│   ├── app/
│   │   ├── controllers/      # Controller REST sotto namespace Api::
│   │   ├── models/           # Modelli ActiveRecord
│   │   └── controllers/concerns/   # JwtAuthentication, AdminAuthorization
│   ├── config/
│   ├── db/
│   │   ├── migrate/
│   │   ├── schema.rb
│   │   └── seeds.rb          # Utenti demo + prodotti di esempio
│   ├── test/
│   │   ├── models/           # Test unitari sui modelli (+ PBT)
│   │   ├── controllers/      # Test di integrazione sui controller
│   │   └── test_helper.rb    # SimpleCov + helper PBT + JWT helper
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── Gemfile
│
├── frontend/                 # Applicazione Angular 21
│   ├── src/app/
│   │   ├── core/             # Servizi, guard, interceptor, modelli
│   │   ├── features/         # Componenti di pagina per area funzionale
│   │   │   ├── admin/        # Pannello amministrativo prodotti
│   │   │   ├── auth/         # Login + registrazione
│   │   │   ├── cart/         # Carrello
│   │   │   ├── checkout/     # Form di checkout
│   │   │   ├── products/     # Catalogo + dettaglio prodotto
│   │   │   ├── user-area/    # Area personale + storico ordini
│   │   │   └── wishlist/     # Wishlist
│   │   ├── shared/           # Componenti condivisi (header)
│   │   └── app.routes.ts
│   ├── e2e/                  # Suite E2E Playwright
│   │   ├── auth.spec.ts
│   │   ├── shopping.spec.ts
│   │   ├── wishlist.spec.ts
│   │   └── admin.spec.ts
│   ├── playwright.config.ts
│   ├── angular.json
│   ├── Dockerfile
│   └── package.json
│
└── .github/workflows/
    ├── ci.yml                # Pipeline CI (lint, security, test, build, E2E)
    └── release.yml           # Pubblicazione immagini su GHCR a tag SemVer
```

## API Endpoints

Tutti gli endpoint sono prefissati da `/api`. Gli endpoint protetti
richiedono l'header `Authorization: Bearer <jwt>` ottenuto da
`POST /api/auth/login` o `POST /api/auth/register`. Gli endpoint
amministrativi richiedono inoltre che l'utente abbia ruolo `admin`.

### Autenticazione

| Metodo | Endpoint | Descrizione | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Registra nuovo utente | — |
| POST | `/api/auth/login` | Login con email + password, restituisce JWT | — |
| POST | `/api/auth/logout` | No-op lato server (il client scarta il token) | — |
| GET | `/api/auth/me` | Dati dell'utente corrente | sì |

### Catalogo prodotti (pubblico)

| Metodo | Endpoint | Descrizione | Auth |
|---|---|---|---|
| GET | `/api/products` | Lista prodotti con filtri | — |
| GET | `/api/products/:id` | Dettaglio prodotto | — |

Query parameters supportati su `GET /api/products`:

- `search=...` — filtro per titolo, case-insensitive
- `price_min=...`, `price_max=...` — filtro per intervallo di prezzo
- `sort=price_asc|price_desc|date_asc|date_desc` — ordinamento
  (default `date_desc`)

### Carrello

| Metodo | Endpoint | Descrizione | Auth |
|---|---|---|---|
| GET | `/api/cart` | Stato del carrello dell'utente (creato lazy) | sì |
| POST | `/api/cart/items` | Aggiunge un prodotto al carrello | sì |
| PATCH | `/api/cart/items/:id` | Modifica la quantità di una voce | sì |
| DELETE | `/api/cart/items/:id` | Rimuove una voce dal carrello | sì |

### Wishlist

| Metodo | Endpoint | Descrizione | Auth |
|---|---|---|---|
| GET | `/api/wishlist` | Stato della wishlist (creata lazy) | sì |
| POST | `/api/wishlist/items` | Aggiunge un prodotto (idempotente) | sì |
| DELETE | `/api/wishlist/items/:id` | Rimuove una voce dalla wishlist | sì |

### Ordini

| Metodo | Endpoint | Descrizione | Auth |
|---|---|---|---|
| GET | `/api/orders` | Storico ordini dell'utente | sì |
| POST | `/api/orders` | Crea un ordine dal carrello | sì |

Filtri supportati su `GET /api/orders`: `date_from`, `date_to`,
`total_min`, `total_max`, `sort=total_asc|total_desc|date_asc|date_desc`.

### Amministrazione catalogo (richiede `role=admin`)

| Metodo | Endpoint | Descrizione | Auth |
|---|---|---|---|
| GET | `/api/admin/products` | Lista prodotti (vista amministrativa) | admin |
| POST | `/api/admin/products` | Crea un nuovo prodotto | admin |
| PATCH | `/api/admin/products/:id` | Modifica un prodotto esistente | admin |
| DELETE | `/api/admin/products/:id` | Elimina un prodotto (cascata sulle voci) | admin |

## Modello dati

I dati corrispondono allo schema definito in
[backend/db/schema.rb](backend/db/schema.rb). 
Per il modello concettuale e il diagramma ER si veda
[SPECIFICHE.md § Modello dei dati](SPECIFICHE.md#modello-dei-dati).


## Testing

### Backend — Minitest + SimpleCov + Rantly (PBT)

I test backend coprono modelli (validazioni, relazioni, serializzazione,
proprietà property-based) e controller API (integrazione end-to-end del
ciclo richiesta → risposta sull'API HTTP).

```bash
# Esegui tutta la suite (in parallelo, default)
docker compose exec backend bin/rails test

# Singolo file
docker compose exec backend bin/rails test test/models/product_test.rb

# Solo modelli o solo controller
docker compose exec backend bin/rails test:models
docker compose exec backend bin/rails test:controllers
```

Al termine SimpleCov genera il report HTML in `backend/coverage/`
(aprire `index.html`). I test paralleli vengono uniti automaticamente
tramite `parallelize_setup` / `parallelize_teardown` nel `test_helper.rb`.

Test property-based: il helper `property_of` è esposto a tutti i test
case via il modulo `PropertyTestHelper` in `test_helper.rb`. I PBT sono
distribuiti su sei file (modelli `CartItem`, `Product`, `User`,
`WishlistItem`, controller `Products` e `WishlistItems`) e coprono
invarianti come l'esattezza di `subtotal`, il roundtrip di `as_json`,
l'autenticazione roundtrip e l'idempotenza HTTP della wishlist.

### Frontend — Vitest + Coverage v8

```bash
# Suite unitaria (watch mode)
cd frontend
npm test

# Una sola esecuzione + report di coverage
npm run test:coverage
```

Il report HTML di coverage finisce in `frontend/coverage/flowboard/`
(aprire `index.html`).

### Frontend — Playwright (E2E)

Quattro spec coprono i flussi principali end-to-end (login/registrazione,
flusso d'acquisto completo, aggiunta/rimozione dalla wishlist, CRUD
admin dei prodotti). Playwright avvia automaticamente backend Rails +
frontend Angular se non sono già in esecuzione.

```bash
cd frontend
npm run e2e                # esegue tutta la suite (chromium)
npm run e2e:ui             # apre l'interfaccia interattiva
npm run e2e:report         # apre l'ultimo report HTML
```

> In CI le E2E vengono eseguite con la variabile `REUSE_SERVER=1`, che
> dice a Playwright di non avviare i server (sono già stati avviati da
> step precedenti del workflow).

## CI/CD

### CI — [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

La pipeline CI gira su ogni Pull Request e su ogni push su `main`. Usa
`paths-filter` per saltare i job non pertinenti al diff. I job sono:

| Job | Cosa fa |
|---|---|
| `backend-lint` | Rubocop su tutto il codice backend |
| `backend-security` | Brakeman (SAST) + bundler-audit (CVE su gem) |
| `backend-test` | Minitest + caricamento del report SimpleCov come artefatto |
| `frontend-lint` | ESLint |
| `frontend-test` | Vitest con coverage + caricamento report Istanbul come artefatto |
| `docker-build` | Build (senza push) di entrambe le immagini Docker — sanity check |
| `e2e` | Avvio servizi + Playwright; upload del report HTML come artefatto in caso di fallimento |
| `ci-success` | Gate finale per branch protection: passa solo se tutti i job richiesti sono passati o saltati |

### CD — [`.github/workflows/release.yml`](.github/workflows/release.yml)

Al push di un tag SemVer (`vX.Y.Z`) il workflow di release costruisce
le immagini Docker di backend e frontend e le pubblica su GitHub
Container Registry con:

- tag esatto della versione (es. `1.0.0`)
- tag `latest`

```bash
# Esempio di release
git tag v1.0.0
git push origin v1.0.0
```

Le immagini risultano disponibili su:

- `ghcr.io/<owner>/shop-backend:<version>`
- `ghcr.io/<owner>/shop-frontend:<version>`

## Troubleshooting

### Errore: il backend non si avvia

```bash
docker compose down
docker compose up --build backend
```

Controlla i log con `docker compose logs backend`.

### Errore: il database non esiste

```bash
docker compose exec backend bin/rails db:create db:migrate
```

### Errore: permessi su Docker

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Errore CORS nel browser

Verifica la configurazione in `backend/config/initializers/cors.rb`. In
sviluppo è permessivo (`origins "*"`); in produzione va ristretto.

### Errore "Cannot find module" lato Angular

```bash
docker compose down
docker compose up --build frontend
```

In alternativa, rigenera `node_modules` localmente:

```bash
cd frontend
rm -rf node_modules
npm install --legacy-peer-deps
```

### Le modifiche al codice non si riflettono

- Backend: il file watcher di Rails rileva i cambiamenti automaticamente.
  Se non funziona, `docker compose restart backend`.
- Frontend: l'ng dev server ricarica in automatico. In Docker, se non
  funziona, `docker compose restart frontend`.

## Licenza

Progetto sviluppato a scopi didattici per l'esame di Ingegneria del
Software Avanzata, AA 2025/2026.
