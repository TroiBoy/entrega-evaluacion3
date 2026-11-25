# Guía de Configuración y Ejecución Local — APITECH 2.0

**APITECH 2.0** permite ejecutar y probar localmente la totalidad de su arquitectura (PostgreSQL 16, las 6 funciones AWS Lambda en Python, el Backend API con ejecutor local del pipeline Lambda, el Simulador IoT dual con 8 escenarios, el Asistente Google Gemini y el Frontend React con las 9 vistas) **sin requerir recursos AWS activos ni generar costos**, y **sin interferir con el primer repositorio `APITECH`**.

---

## 1. Aislamiento respecto a `APITECH` (Versión 1)

| Componente | `APITECH` (Versión 1) | `APITECH2` (Versión 2) |
|---|---|---|
| **Puerto PostgreSQL Local** | `5432` (`.pgdata/`, `apitech_db`) | **`5433`** (`.pgdata2/`, `apitech2_db`) |
| **Puerto Backend API / WS** | `3001` | **`3002`** |
| **Puerto Frontend Vite** | `5173` (Docker: `8080`) | **`5174`** (Docker: `8082`) |

Ambos proyectos pueden ejecutarse simultáneamente en el mismo computador para compararlos en vivo.

---

## 2. Ejecución Local Nativa Automatizada (Windows PowerShell)

### Requisitos verificados en el equipo (en espacio de usuario `%USERPROFILE%\.local`)
- **Node.js**: `v22.23.5` (`%USERPROFILE%\.local\node\node.exe`)
- **PostgreSQL**: `16.14` (`%USERPROFILE%\.local\pgsql\bin\psql.exe`)
- **Python**: `3.12.7` (`%USERPROFILE%\.local\python\tools\python.exe`)

### Paso 1: Configurar variables de entorno
Crear `backend/.env` a partir de `.env.example` (el archivo `backend/.env` está excluido en `.gitignore`):

```env
NODE_ENV=development
PORT=3002
APITECH2_MODE=local
DB_MODE=local
DB_HOST=localhost
DB_PORT=5433
DB_USER=apitech2
DB_PASSWORD=apitech2_local_2026
DB_NAME=apitech2_db
SIMULATOR_FREQUENCY_MODE=DEMO_4S
SIMULATOR_TRANSPORT_MODE=LOCAL_LAMBDA_PIPELINE
CORS_ORIGINS=http://localhost:5174,http://localhost:5173,http://localhost:8082,http://127.0.0.1:5174
GEMINI_API_KEY=<TU_API_KEY_GOOGLE_AI_STUDIO>
```

### Paso 2: Iniciar todos los servicios con un comando
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```
Este script:
1. Inicializa (si no existe) el cluster PostgreSQL independiente en `.pgdata2/` sobre el puerto `5433`.
2. Crea el rol `apitech2` y la base de datos `apitech2_db`.
3. Aplica las migraciones versionadas (`001_schema_apitech2.sql`, `002_politica_retencion_y_auditoria.sql`, `003_seed_apitech2.sql`).
4. Inicia el Backend API en `http://localhost:3002`.
5. Inicia el Simulador IoT en modo `DEMO_4S` (4000 ms, conmutable en vivo a `OPERATIVO_30M` 30 minutos).
6. Inicia el Frontend React + Vite en `http://localhost:5174`.

### Paso 3: Detener los servicios locales
```powershell
# Detener Backend, Simulador y Frontend (agregar -StopDb para detener también PostgreSQL 5433)
powershell -ExecutionPolicy Bypass -File .\scripts\stop-local.ps1 -StopDb
```

---

## 3. Ejecución Local con Docker Compose

Cuando Docker Desktop se encuentre instalado en la estación de trabajo:

```bash
cp .env.example .env
docker compose up -d --build
```
- Frontend Nginx: `http://localhost:8082`
- Backend API: `http://localhost:3002/api/health`
- PostgreSQL 16: `localhost:5433`
