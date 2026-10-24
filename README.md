# StaffFlow RH

Plataforma de Recursos Humanos para empresas colombianas: empleados, vacaciones, novedades laborales, asistencia con QR, permisos, costos laborales y analítica. Cada empresa configura sus reglas internas desde el **Panel Super**, y el **motor legal** impide configurar condiciones por debajo del Código Sustantivo del Trabajo.

- 📜 [Marco legal y reglas configurables](docs/MARCO_LEGAL.md)
- 🗺️ [Diagnóstico y hoja de ruta SaaS](docs/ROADMAP_SAAS.md)
- 📝 [Changelog](CHANGELOG.md)

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TailwindCSS (`frontend/`), desplegado en Vercel |
| Backend | Node.js + Express + Sequelize (`backend/`), desplegado en Render |
| Base de datos | PostgreSQL (Supabase) en producción; SQLite local si no hay variables de BD |

Requiere **Node.js 22.12+** (Vite 8 no corre en versiones anteriores).

## Ejecución local

```bash
npm run install-all          # instala raíz, backend y frontend
npm run seed:superuser       # crea superadmin / Admin123456* (cámbiala al entrar)
npm run dev                  # backend en :5000 y frontend en :5173
npm test --prefix backend    # pruebas del motor legal
```

Sin `DATABASE_URL` ni `DB_HOST`, el backend usa `backend/database.sqlite`.

## Variables de entorno

**`backend/.env`**

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL (Supabase). Alternativa: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` |
| `JWT_SECRET` | **Obligatoria en producción.** El valor por defecto del código no es seguro |
| `PORT` | Puerto del API (por defecto 5000) |

**`frontend/.env`**

| Variable | Uso |
|---|---|
| `VITE_API_URL` | URL pública del backend |

## Estructura

```
backend/
  utils/laborLaw.js        ← pisos del CST y políticas por empresa (única fuente de verdad legal)
  utils/colombianHolidays.js
  controllers/             ← lógica de cada módulo
  models/                  ← modelos Sequelize
  jobs/vacationUpdater.js  ← cron diario de estados de vacaciones
  tests/                   ← pruebas (node:test)
  server.js                ← rutas, migraciones de arranque y sembrado
frontend/src/
  views/                   ← pantallas
  components/              ← componentes reutilizables
  utils/                   ← fechas, festivos, exportaciones
docs/                      ← documentación de producto y legal
```

Los archivos `promt.md`, `staffflow_requirements.md`, `reporte_brechas_vacaciones.md` y los `.md` de `backend/` son los requerimientos históricos del producto.

## Roles

| Rol | Alcance |
|---|---|
| Super Usuario | Reglas de la empresa, políticas laborales, usuarios, auditoría y todos los módulos |
| Administrador | Operación de RRHH: empleados, vacaciones, novedades, asistencia y reportes |
| Recursos Humanos | Operación diaria, costos laborales y analítica |

Los permisos se validan en el backend con `requireRole`; el frontend solo oculta las opciones.

## Convenciones

- `Vacation.endDate` es el **último día de descanso (inclusive)**, no el día de regreso.
- Los registros de vacaciones no se borran: se cancelan (Art. 187 CST).
- Toda regla legal nueva va en `backend/utils/laborLaw.js`, con el artículo en un comentario y una prueba en `backend/tests/`.
- KPIs y gráficos usan siempre datos reales de la base de datos (ver CHANGELOG).
