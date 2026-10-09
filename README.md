# CuriousNext

CuriousNext helps adult beginners choose a useful learning pathway and demonstrate what they understand. The pilot covers Practical AI and Cybersecurity Essentials through explanatory text, purposeful visuals, supported practice, independent tasks and teach-back.

## Current state

This repository contains product, curriculum and design specifications plus an M1 authentication proof of concept and an authorised M2 course-plan preview. Email-only access, explicit link confirmation and session checks are implemented locally. Goal setting, bounded plan generation, saved acceptance and provisional readiness placement are implemented locally. Lessons and assessment remain unimplemented. No hosted environment or live Neon/Resend integration has been verified. Curriculum, language and user design review remain pending. See [milestone status](Documentation.md) for evidence.

## Start here

- [Product requirements](Prompt.md), [roadmap](Plans.md) and [implementation entry](Implement.md).
- [Architecture](Architecture.md), [domain model](docs/design-docs/domain-model.md) and [security](docs/design-docs/security.md).
- [Learner journeys](docs/product-specs/user-flows.md), [curriculum](docs/curriculum/index.md), [design system](docs/DESIGN.md) and [screen behavior](docs/FRONTEND.md).
- [Repository map](AGENTS.md), [document ownership](docs/design-docs/document-ownership.md), [plans](docs/exec-plans/index.md) and [decisions](docs/design-docs/decisions/index.md).

## Run repository checks

Use Python 3.12 and Node.js 24, matching CI. Python governance checks use the standard library. Application dependencies are locked in package-lock.json.

```sh
python3 scripts/validate_repo.py
python3 -m unittest discover -s tests -v
python3 scripts/validate_design_artifacts.py
npm ci
npm run check
npm audit --audit-level=high
```

After reviewing documentation changes, run `python3 scripts/validate_repo.py --refresh` and commit the updated fingerprints. See [engineering workflow](docs/design-docs/engineering.md). Each slice is tested, reviewed and proposed through a PR. PRs are left open without merging or auto-merge.

## Product boundaries

Accessibility is required from the first screen. Teaching-language release targets are English, Nigerian Pidgin, Igbo, Yoruba and Hausa, subject to reviewed content and assessment parity. Neither those languages nor accessibility conformance are implemented claims. Uploaded files, unrestricted course generation, voice and offline synchronisation are deferred.

## Application setup and deployment

The accepted stack uses Next.js, Neon PostgreSQL, Drizzle, Better Auth, Resend and Vercel. See the [stack decision](docs/design-docs/decisions/002-neon-pilot-stack.md) and [deployment runbook](docs/design-docs/deployment.md). No service account, credentials or paid resource is created by installation or startup.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000/access for the email shell. Without service configuration it displays honest unavailable feedback. To test real delivery, configure a synthetic-data Neon database, a verified Resend sender, a random server secret of at least 32 characters and an exact BETTER_AUTH_URL origin matching your browser URL. Use HTTPS and TLS database connections on hosted environments. Keep secrets outside Git and screenshots.

Apply [authentication](migrations/0001-access.sql) [course-plan](migrations/0002-course-plans.sql), and [enrollment preferences](migrations/0003-enrollment-preferences.sql) migrations in order, once each to a new isolated test database before enabling access. Use a schema-owner migration role and a separate application role. Application startup never migrates the database.

```sh
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0001-access.sql
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0002-course-plans.sql
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0003-enrollment-preferences.sql
```

The integration suite uses real Better Auth with a disposable PGlite PostgreSQL engine and captured test-only mail. It does not contact Neon or Resend. The [API specification](docs/design-docs/api-spec.md) documents implemented authentication/course-preview routes and future learning contracts. The [mobile review](docs/design-docs/authentication-review.md) records the checks and their limits.

After magic-link verification, open /onboarding. Set AI_PROVIDER=groq, server-only GROQ_API_KEY and an explicit GROQ_MODEL to enable live generation. Groq access, quotas and billing are managed separately from a ChatGPT subscription. No model fallback is used. Without these values, your goal remains saved and generation reports unavailable. [Generation contract](docs/design-docs/course-generation.md) records synthetic checks and live evaluation gates.
