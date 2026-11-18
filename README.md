# NestJS Learning Journey: 7-Day Roadmap

My learning project for NestJS, coming from Node.js + Express.

**Stack:** NestJS · TypeScript · ESM · Vitest · Oxlint
**Official docs:** https://docs.nestjs.com

---

## Quick Start

```bash
npm install
# Configure MONGODB_URI and JWT_SECRET in .env before starting
npm run start:dev      # http://localhost:3000
npm run test           # unit tests
npm run build          # compile to dist/
```

> Windows PowerShell tip: use `curl.exe` instead of `curl`.
> ESM tip: relative imports need the `.js` extension, e.g. `import { X } from './x.service.js'`.

---

## Express to NestJS Cheat Sheet

| Express | NestJS |
|---|---|
| `app.get('/x', handler)` | `@Get('x')` inside a **Controller** |
| Logic inside route handlers | **Service** (`@Injectable()`) |
| `app.use(mw)` | **Middleware**, Guards, Interceptors, Pipes |
| Folders by convention | **Module** (`@Module()`) |
| Manual `req.body` checks | **DTO** + `ValidationPipe` |
| `require` / manual wiring | **Dependency Injection** |

---

## Progress Tracker

- [ ] Day 1: Core concepts and first CRUD
- [ ] Day 2: DTOs, validation, pipes, errors
- [ ] Day 3: Config, structure, multiple modules
- [ ] Day 4: Database
- [ ] Day 5: Authentication (JWT) and guards
- [ ] Day 6: Interceptors, filters, middleware, Swagger
- [ ] Day 7: Testing, build, polish

**Suggested time:** 2-3 hours per day. Build something every day; don't only read.

---

## Day 1: Core Concepts and First CRUD

**Goal:** Understand modules, controllers, services, and dependency injection.

**Learn**
- What a Module, Controller, and Provider are
- How DI works (constructor injection, no `new`)
- Request flow: Request → Controller → Service → Response

**Do**
1. Run the app and open `http://localhost:3000`
2. Read `main.ts`, `app.module.ts`, `app.controller.ts`, `app.service.ts`
3. Generate a resource:
   ```bash
   nest g resource users
   ```
4. Open `src/users/` and read every generated file
5. Define the `User` entity (`id`, `name`, `email`)
6. Store users in an in-memory array in `users.service.ts` and make all 5 CRUD methods work
7. Test every endpoint with Postman, Thunder Client, or `curl.exe`

**Checkpoint**
- [ ] I can explain why the controller never does `new UsersService()`
- [ ] I can explain the difference between DTO and entity
- [ ] CRUD works with in-memory data

**Read:** Docs → First steps, Controllers, Providers, Modules

---

## Day 2: DTOs, Validation, Pipes, and Errors

**Goal:** Never trust request data. Validate everything.

**Learn**
- DTOs are classes (they exist at runtime, interfaces don't)
- `class-validator` decorators
- Built-in pipes and exceptions

**Do**
1. Install:
   ```bash
   npm i class-validator class-transformer
   ```
2. Add validation decorators to `CreateUserDto` (`@IsString`, `@IsEmail`, `@MinLength`)
3. Enable globally in `main.ts`:
   ```ts
   app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
   ```
4. Use `ParseIntPipe` on `:id` params
5. Throw `NotFoundException` when a user doesn't exist
6. Understand `PartialType` in `UpdateUserDto`
7. Send bad requests on purpose and read the 400 responses

**Checkpoint**
- [ ] Invalid email returns 400 with a clear message
- [ ] Extra fields in the body are stripped (`whitelist`)
- [ ] `GET /users/999` returns 404

**Read:** Docs → Pipes, Validation, Exception filters (basics)

---

## Day 3: Config, Structure, and Multiple Modules

**Goal:** Organize a real project and make modules talk to each other.

**Learn**
- Feature-based folder structure
- `imports` / `exports` between modules
- Environment configuration

**Do**
1. Install config:
   ```bash
   npm i @nestjs/config
   ```
2. Create `.env` (`PORT=3000`) and add `.env` to `.gitignore`
3. Register `ConfigModule.forRoot({ isGlobal: true })` and read `PORT` via `ConfigService`
4. Add a global prefix: `app.setGlobalPrefix('api')`
5. Generate a second feature, e.g. `nest g resource posts` (or `notes`)
6. Make `PostsModule` use `UsersService`: export it from `UsersModule`, import `UsersModule` in `PostsModule`
7. Create `src/common/` for shared code

**Checkpoint**
- [ ] I understand the "Nest can't resolve dependencies" error and how to fix it
- [ ] Config comes from `.env`, not hard-coded values

**Read:** Docs → Configuration, Modules (shared modules)

---

## Day 4: Database

**Goal:** Replace in-memory data with a real database.

**This project uses Mongoose + MongoDB.** The app reads its connection string from `MONGODB_URI`; `.env.example` lists the required environment variables.

**Do**
1. Start a local MongoDB server, or create a MongoDB Atlas cluster
2. If you do not already have `.env`, copy `.env.example`; otherwise preserve it and add/update `MONGODB_URI`
3. Read `src/app.module.ts`: `MongooseModule` connects once using the configured URI
4. Read `src/users/schemas/user.schema.ts`: `@Schema` and `@Prop` define the stored fields and unique email
5. Read `src/users/users.module.ts`: `forFeature` registers the model for dependency injection
6. Read `src/users/users.service.ts`: the injected model now implements persistent CRUD
7. Test `GET`, `PATCH`, and `DELETE /users`; use the returned MongoDB `_id` for item routes. Account creation is handled by `/auth/register` (Day 5).

**Checkpoint**
- [ ] Data survives a server restart
- [ ] Unique email is enforced
- [ ] Invalid MongoDB IDs return 400 and missing users return 404

**Read:** NestJS docs → Techniques → Mongo, and Mongoose's schema/model guides

---

## Day 5: Authentication (JWT) and Guards

**Goal:** Register, log in, and protect routes.

**Learn**
- Password hashing
- JWT access tokens
- Guards (Nest's request gate, similar to Express auth middleware)

**Do**
1. Put a random `JWT_SECRET` of at least 32 characters in `.env` (keep `.env` out of Git).
   Generate one with:
   ```bash
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```
2. `POST /auth/register` accepts `{ "name", "email", "password" }`; the password is bcrypt-hashed before MongoDB stores it.
3. `POST /auth/login` checks the hash and returns an `access_token`.
4. Send that token on protected requests as `Authorization: Bearer <access_token>`.
5. `JwtStrategy` validates the signature and expiry; the global `JwtAuthGuard` rejects requests without a valid token.
6. `@Public()` is the Nest equivalent of an auth middleware bypass; it is used only on registration, login, and the root route.
7. All `/users` routes require a token. Account creation is through `/auth/register`; `POST /users` was removed.
8. The password hash is excluded from normal user queries and API responses.

**Checkpoint**
- [ ] Protected route returns 401 without a token
- [ ] Protected route works with a valid token
- [ ] MongoDB stores a hash, never the submitted password

**Read:** Docs → Authentication, Guards, Custom decorators

---

## Day 6: Interceptors, Filters, Middleware, and Swagger

**Goal:** Learn the cross-cutting tools that make Nest powerful.

**Learn the request lifecycle**
```
Middleware → Guards → Interceptors (before) → Pipes → Controller
→ Service → Interceptors (after) → Exception Filters
```

**Do**
1. **Middleware:** `nest g middleware logger`, log method and URL of every request
2. **Interceptor:** create a response-wrapping interceptor, e.g. `{ success: true, data: ... }`
3. **Exception filter:** create a global filter for consistent error responses
4. **Swagger:**
   ```bash
   npm i @nestjs/swagger
   ```
   Set it up in `main.ts` and view docs at `/api/docs`
5. Add pagination (`?page=1&limit=10`) to `GET /users` using a shared DTO in `common/dto/`
6. Enable CORS: `app.enableCors()`

**Checkpoint**
- [ ] All responses and errors share a consistent shape
- [ ] Swagger lists every endpoint
- [ ] I can explain the order of middleware, guards, interceptors, and pipes

**Read:** Docs → Middleware, Interceptors, Exception filters, OpenAPI

---

## Day 7: Testing, Build, and Polish

**Goal:** Prove it works and make the project presentable.

**Do**
1. **Unit test** `UsersService` with Vitest, mocking the database layer
   ```bash
   npm run test
   ```
2. **Unit test** a controller with a mocked service
3. **E2E test**: register → login → call a protected route
   ```bash
   npm run test:e2e
   ```
4. Build and run production mode:
   ```bash
   npm run build
   npm run start:prod
   ```
5. Run the linter and fix issues
6. Update this README with your real endpoints and env variables
7. Push to GitHub

**Checkpoint**
- [ ] Tests pass
- [ ] Production build runs
- [ ] A stranger could clone the repo and run it from the README

**Read:** Docs → Testing, Techniques → Compression/Security (helmet, rate limiting)

---

## After Week 1

| Topic | Why |
|---|---|
| Role-based access (RBAC) | Admin vs user permissions |
| Refresh tokens | Real-world auth |
| Caching (`@nestjs/cache-manager`) | Performance |
| Queues (BullMQ) | Background jobs, emails |
| File uploads (Multer) | Images and documents |
| WebSockets (Gateways) | Real-time features |
| Rate limiting (`@nestjs/throttler`) | Abuse protection |
| Docker + deployment | Shipping it |
| Microservices / GraphQL | Advanced Nest features |

---

## Daily Routine

1. **Review** yesterday's checkpoint (10 min)
2. **Read** the matching docs section (30 min)
3. **Build** the day's tasks (1-2 hours)
4. **Commit** your work with a clear message
5. **Write** 2-3 lines in the notes section below

---

## My Notes

**Day 1:**

**Day 2:**

**Day 3:**

**Day 4:**

**Day 5:**

**Day 6:**

**Day 7:**

---

## Common Errors and Fixes

| Error | Likely cause |
|---|---|
| `Nest can't resolve dependencies of X` | Provider not in `providers`, or module not imported/exported |
| `A merge conflicted on path ...` | File already exists (e.g. ran `nest g module` after `nest g resource`) |
| Validation not working | `ValidationPipe` not enabled in `main.ts`, or DTO is an interface instead of a class |
| `Cannot find module './x.service'` (ESM) | Missing `.js` extension in the import |
| Port already in use | Another process is using 3000; change `PORT` in `.env` |