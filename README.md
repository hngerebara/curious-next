# CuriousNext

CuriousNext helps adult learners turn a personal goal into a learning path, explore ideas through visual teaching and practice, and use feedback to choose their next step. Historical Practical AI and Cybersecurity pilots retain their original evidence and assessment rules.

## Current state

CuriousNext is being expanded into a goal-first tutor for adult English learners across common topics. New setup asks for a personal goal, separate explanation and visual preferences, and session duration. Generated paths lead through optional placement, actual visual teaching, practice, teach-back and feedback. Historical Practical AI and Cybersecurity work remains accessible through owned links.

Generated content and assessment are previews rather than approved general curriculum. Independent content/provider review, actual screen-reader acceptance, M4 scoring questions and deployment remain separate gates. See [status](Documentation.md) for measured acceptance and [the active tutor plan](docs/exec-plans/active/goal-first-tutor.md) for delivery.

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

Accessibility is required from the first screen. Teaching-language release targets are English, Nigerian Pidgin, Igbo, Yoruba and Hausa, subject to reviewed content and assessment parity. Neither those languages nor accessibility conformance are implemented claims. Generated paths across common educational topics are previews, while public course publication, uploaded files, voice and offline synchronisation remain deferred.

## Application setup and deployment

The accepted stack uses Next.js, Neon PostgreSQL, Drizzle, Better Auth, Resend and Vercel. See the [stack decision](docs/design-docs/decisions/002-neon-pilot-stack.md) and [deployment runbook](docs/design-docs/deployment.md). No service account, credentials or paid resource is created by installation or startup.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000/access for the email shell. Without service configuration it displays honest unavailable feedback. To test real delivery, configure a synthetic-data Neon database, a verified Resend sender, a random server secret of at least 32 characters and an exact BETTER_AUTH_URL origin matching your browser URL. Use HTTPS and TLS database connections on hosted environments. Keep secrets outside Git and screenshots.

Apply [authentication](migrations/0001-access.sql), [course-plan](migrations/0002-course-plans.sql), [enrollment preferences](migrations/0003-enrollment-preferences.sql), [attempt loop](migrations/0004-attempt-loop.sql), [retention modes](migrations/0005-retention-modes.sql), [generated paths](migrations/0006-generated-tutor.sql), [lessons](migrations/0007-tutor-lessons.sql), [request binding](migrations/0008-tutor-lesson-requests.sql), and [submission uniqueness](migrations/0009-tutor-submissions.sql) migrations in order, once each to a new isolated test database before enabling access. Use a schema-owner migration role and a separate application role. Application startup never migrates the database.

```sh
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0001-access.sql
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0002-course-plans.sql
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0003-enrollment-preferences.sql
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0004-attempt-loop.sql
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0005-retention-modes.sql
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0006-generated-tutor.sql
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0007-tutor-lessons.sql
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0008-tutor-lesson-requests.sql
psql "$DATABASE_URL_UNPOOLED" --single-transaction --set ON_ERROR_STOP=1 --file migrations/0009-tutor-submissions.sql
```

The integration suite uses real Better Auth with a disposable PGlite PostgreSQL engine and captured test-only mail. It does not contact Neon or Resend. The [API specification](docs/design-docs/api-spec.md) documents implemented authentication/course-preview/AI-2 routes and later learning contracts. The [mobile review](docs/design-docs/authentication-review.md) records the checks and their limits.

After magic-link verification, open /onboarding. Set AI_PROVIDER=openai, server-only OPENAI_API_KEY and OPENAI_MODEL=gpt-6.1-sol to enable live generation. OpenAI API access, quotas and billing are managed separately from a ChatGPT subscription. No model fallback is used. Without these values, your goal remains saved and generation reports unavailable. [Generation contract](docs/design-docs/course-generation.md) records synthetic checks and live evaluation gates.

## Local magic-link inbox

Set EMAIL_DELIVERY=local, BETTER_AUTH_URL=http://127.0.0.1:3000, a random BETTER_AUTH_SECRET (32+ characters) and DATABASE_URL in ignored .env.local. Use an isolated synthetic-data Neon database. No Resend account or email credentials are required for this mode. The server must run with npm run dev, bound to loopback. Use the exact auth origin in your browser.

For a new empty project database, run `node --env-file=.env.local scripts/migrate-local.mjs` explicitly. This applies reviewed migrations in one transaction and records their checksums. Repeated execution skips matching migrations. Existing untracked schemas fail for manual review. The script uses DATABASE_URL_UNPOOLED when provided, otherwise the local test connection. Separate schema/app roles are still required before deployment.

Open /access, enter a fictional email such as learner@example.test, request a link, then open /dev/mail. Click Open test sign-in link and Confirm and continue. The same flow handles registration and returning login. Confirmation creates a real local test session. It does not prove ownership of a real mailbox.

The private .local-mail/ directory is ignored by Git. Links expire after ten minutes and are removed on inbox reads. Local inbox access requires development mode and loopback origin/Host with same-origin navigation. It is blocked on production or hosted environments. Do not expose the dev server through tunnels or proxies. Delete local test emails after testing and keep test accounts separate from production learner data. Missing real email credentials never fall back to local mode.

Before deployment, choose/configure actual email delivery, test inbox receipt, inspect logging/tracking, use isolated environments and repeat access/ownership tests. [Local decision and completion gates](docs/design-docs/decisions/004-local-email-preview.md).

## Clear-prompts reference preview

Existing Practical AI enrollments containing AI-2 retain their owned /onboarding?enrollment=... and /learning?enrollment=... links, and earlier work is accessible through /learning?legacy=1. The reference preview is available separately from the provisional pathway. AI-1 readiness is not treated as achievement. English draft curriculum and assessor calibration remain unapproved. Practice uses fictional River Cafe, fresh independent tasks use distinct pinned study-club packs with the same rubric. Twelve proof contexts per learner are available. Repeating a context is not transfer.

Save your prompt, run Practice AI, inspect its actual response, then write the checklist and explanation. The separate Learning assistant records accepted substantive help before delivery. It prevents independent demonstration for that attempt. Explanation variants preserve the draft and rubric, without changing your course default.

Choose Submit for feedback. The server sequence saves work, freezes it, then assesses the saved submission. Assessment processing is an awaited authenticated request backed by a durable job. Return/retry after an interruption, using the same snapshot and bounded lease. Failed/uncertain feedback adds no evidence. Earlier evidence remains inspectable. Optional review is recorded without a promise of a reviewer. Production worker scheduling, reviewed content, real email delivery and assistive-technology acceptance remain gates. M4 recall/transfer preview is implemented. Final provider acceptance and M5 export remain open.

The configured OPENAI_MODEL serves separate practice/assessment roles using the same private server key. No provider fallback or autonomous background process runs. Database setup explicitly applies 0004 and retains the checksum ledger. Synthetic integration tests use PGlite, live-service evidence is recorded separately in Documentation.md.

The following Groq commands are historical operators. Keep their results for comparison. Use the OpenAI operators below for current-profile validation.

Run the historical fictional assessor evaluation separately from CI:

```sh
node_modules/.bin/esbuild scripts/evaluate-attempt-assessment.mts --bundle --platform=node --format=esm --outfile=/tmp/cn-attempt-evaluation.mjs
node /tmp/cn-attempt-evaluation.mjs --live
```

It loads ignored local Groq configuration and makes two bounded calls, 30 seconds apart. It records all outcomes, including provider failures, in docs/design-artifacts/attempt-loop/assessor-evaluation.json. Existing recorded initial results are preserved separately. Agent-authored expectations and one sample per case are not assessor calibration. No real learner data or database is used by this script.

For repeated AI-2 fixture agreement, preserve each study under a new output filename:

```sh
node_modules/.bin/esbuild scripts/evaluate-attempt-calibration.mts --bundle --platform=node --format=esm --outfile=/tmp/cn-attempt-calibration.mjs
node /tmp/cn-attempt-calibration.mjs --live --output=docs/design-artifacts/attempt-loop/calibration-new-study.json
```

This makes sixteen Groq calls, one minute apart, plus two explicitly simulated infrastructure failures. It checks six AI-2 fixtures and two adversarial cases twice. CY-2 fixtures are reported as unrun until its assessor exists. It refuses to overwrite a prior study, saves each result immediately and keeps expected labels out of model input. A nonzero exit reports a disagreement or unavailable assessment, with results retained. Agreement with agent-assigned labels is not independent calibration approval.

Assessor feedback uses criterion-specific reason codes and server-owned wording. Numeric A5 feedback comes from complete explicit Q:/A: pairs, alternative formats remain eligible and are reviewed without automatic counts. Unknown or contradictory reasons are unavailable assessments. Previous frozen results retain their original feedback and profile.

M4 preview shares `/learning` and the attempt endpoints across AI-2 and CY-2. Cybersecurity enrollments expose inert fictional action choices, without Practice AI. `recall` is available only when due after independent evidence, `transfer` applies the skill in a new scenario family. Accepting instructional help keeps checks assisted. Run the operator-only CY study by bundling `scripts/evaluate-cyber-calibration.mts`, then passing `--live` and a new `--output=docs/design-artifacts/adaptive-loop/<name>.json`. Expected fixture labels stay outside the assessor payload. Subject review and independent calibration remain release gates.

## Clear learning and OpenAI preview

Tell CuriousNext what you want to learn. Practise a small task. Get feedback. Know what to try next. Today presents one recommended activity, Your path shows demonstrated/current/preparation states, and Your work restores saved attempts. English preview only.

The active provider is OpenAI Responses with strict structured output, low reasoning and store:false. Keys remain in ignored server configuration. Historical Groq scripts/results remain historical and do not establish current acceptance. Bundle `scripts/evaluate-openai-preview.mts` with esbuild and run with `--live --output=docs/design-artifacts/clear-learning/<new-name>.json`. Use `scripts/evaluate-openai-course.mts` for the nine course-generation cases. It refuses an existing filename, paces calls and records failures without learner data. Model agreement with agent-authored labels is not independent calibration.
