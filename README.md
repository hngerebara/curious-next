# CuriousNext

CuriousNext helps adult beginners choose a useful learning pathway and demonstrate what they understand. The pilot covers Practical AI and Cybersecurity Essentials through explanatory text, purposeful visuals, supported practice, independent tasks and teach-back.

## Current state

This repository contains product, curriculum and design specifications plus an M1 authentication proof of concept and an authorised M2 course-plan preview. Email-only access, explicit link confirmation and session checks are implemented locally. Goal setting, bounded plan generation, saved acceptance and objective-based provisional placement are implemented locally. The authorised M3 AI-2 preview now has saved lessons/drafts, separate practice AI and instructional help, frozen submissions, durable assessment retries and evidence-based guidance. No application is deployed. Live Neon validation is recorded in the milestone ledger. Real email delivery is deferred until deployment. Curriculum, language and user design review remain pending. See [milestone status](Documentation.md) for evidence.

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

Apply [authentication](migrations/0001-access.sql), [course-plan](migrations/0002-course-plans.sql), [enrollment preferences](migrations/0003-enrollment-preferences.sql), and [attempt loop](migrations/0004-attempt-loop.sql) migrations in order, once each to a new isolated test database before enabling access. Use a schema-owner migration role and a separate application role. Application startup never migrates the database.

```sh
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0001-access.sql
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0002-course-plans.sql
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0003-enrollment-preferences.sql
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0004-attempt-loop.sql
```

The integration suite uses real Better Auth with a disposable PGlite PostgreSQL engine and captured test-only mail. It does not contact Neon or Resend. The [API specification](docs/design-docs/api-spec.md) documents implemented authentication/course-preview/AI-2 routes and later learning contracts. The [mobile review](docs/design-docs/authentication-review.md) records the checks and their limits.

After magic-link verification, open /onboarding. Set AI_PROVIDER=groq, server-only GROQ_API_KEY and an explicit GROQ_MODEL to enable live generation. Groq access, quotas and billing are managed separately from a ChatGPT subscription. No model fallback is used. Without these values, your goal remains saved and generation reports unavailable. [Generation contract](docs/design-docs/course-generation.md) records synthetic checks and live evaluation gates.

## Local magic-link inbox

Set EMAIL_DELIVERY=local, BETTER_AUTH_URL=http://127.0.0.1:3000, a random BETTER_AUTH_SECRET (32+ characters) and DATABASE_URL in ignored .env.local. Use an isolated synthetic-data Neon database. No Resend account or email credentials are required for this mode. The server must run with npm run dev, bound to loopback. Use the exact auth origin in your browser.

For a new empty project database, run `node --env-file=.env.local scripts/migrate-local.mjs` explicitly. This applies reviewed migrations in one transaction and records their checksums. Repeated execution skips matching migrations. Existing untracked schemas fail for manual review. The script uses DATABASE_URL_UNPOOLED when provided, otherwise the local test connection. Separate schema/app roles are still required before deployment.

Open /access, enter a fictional email such as learner@example.test, request a link, then open /dev/mail. Click Open test sign-in link and Confirm and continue. The same flow handles registration and returning login. Confirmation creates a real local test session. It does not prove ownership of a real mailbox.

The private .local-mail/ directory is ignored by Git. Links expire after ten minutes and are removed on inbox reads. Local inbox access requires development mode and loopback origin/Host with same-origin navigation. It is blocked on production or hosted environments. Do not expose the dev server through tunnels or proxies. Delete local test emails after testing and keep test accounts separate from production learner data. Missing real email credentials never fall back to local mode.

Before deployment, choose/configure actual email delivery, test inbox receipt, inspect logging/tracking, use isolated environments and repeat access/ownership tests. [Local decision and completion gates](docs/design-docs/decisions/004-local-email-preview.md).

## Clear-prompts reference preview

Accept a Practical AI preview containing AI-2, choose your starting point, then open the clear-prompts link in /onboarding. The reference preview is available separately from the provisional pathway. AI-1 readiness is not treated as achievement. English draft curriculum and assessor calibration remain unapproved. Practice uses fictional River Cafe, fresh independent tasks use distinct pinned study-club packs with the same rubric. Twelve proof contexts per learner are available. Repeating a context is not transfer.

Save your prompt, run Practice AI, inspect its actual response, then write the checklist and explanation. The separate Learning assistant records accepted substantive help before delivery. It prevents independent demonstration for that attempt. Explanation variants preserve the draft and rubric, without changing your course default.

Freeze the submission, then choose Assess saved submission. Assessment processing is an awaited authenticated request backed by a durable job. Return/retry after an interruption, using the same snapshot and bounded lease. Failed/uncertain feedback adds no evidence. Earlier evidence remains inspectable. Optional review is recorded without a promise of a reviewer. Production worker scheduling, reviewed content, real email delivery and assistive-technology acceptance remain gates. M4 recall/transfer execution and M5 export are not implemented.

The configured GROQ_MODEL serves separate practice/assessment roles using the same server key. No provider fallback or autonomous background process runs. Database setup explicitly applies 0004 and retains the checksum ledger. Synthetic integration tests use PGlite, live-service evidence is recorded separately in Documentation.md.

Run the explicit fictional assessor evaluation separately from CI:

```sh
node_modules/.bin/esbuild scripts/evaluate-attempt-assessment.mts --bundle --platform=node --format=esm --outfile=/tmp/cn-attempt-evaluation.mjs
node /tmp/cn-attempt-evaluation.mjs --live
```

It loads ignored local Groq configuration and makes two bounded calls, 30 seconds apart. It records all outcomes, including provider failures, in docs/design-artifacts/attempt-loop/assessor-evaluation.json. Existing recorded initial results are preserved separately. Agent-authored expectations and one sample per case are not assessor calibration. No real learner data or database is used by this script.
