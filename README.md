# CuriousNext

CuriousNext is a personal learning tutor that helps you turn something you want to learn into a clear path, understand it through explanations and visuals, and practise with feedback that guides your next step.

You start with your own goal, rather than choosing from a fixed course catalogue. You choose how you want ideas explained and how much time you have, then CuriousNext generates a learning path for you to review before you begin.

> Tell CuriousNext what you want to learn, choose how you want it explained, and practise with feedback that helps you decide what comes next.

## Try the demo

Open the [CuriousNext hosted preview](https://curious-next.vercel.app/). Signed-in learners return to their learning journey. New learners start with a goal and teaching preferences after signing in.

When temporary demo mode is enabled, the login page displays the shared demo password. Everyone using that account shares its goals, lessons and saved work, so enter fictional information only. This public demo access is separate from personal email magic-link sign-in and does not establish private learner accounts or release readiness.

## Why this project exists

Finding learning material does not always tell you where to start, whether you understand it, or what to work on next. CuriousNext brings those decisions into one learning journey, connecting your goal, teaching, practice and feedback.

The aim is to help you understand and apply an idea, rather than move through content simply to mark it complete. Your teaching preferences influence how an idea is presented, while your work provides the evidence used to recommend further learning.

## How the learning journey works

1. **Describe your goal.** Explain what you want to learn or be able to do, and clarify it when the outcome needs more detail.
2. **Choose how you want to learn.** Select your explanation depth, visual preference and a session length of 10, 20 or 40 minutes.
3. **Review your personal path.** Explore four to eight suggested modules, including their outcomes, order and reasons, before accepting the path.
4. **Choose your starting point.** Answer optional diagnostic questions, choose an earlier module, or start from the beginning. Placement estimates readiness without marking skills as demonstrated.
5. **Learn and practise.** Study explanations, worked examples and visual representations, then try a small choice, matching or ordering activity.
6. **Explain your understanding.** Apply the idea and teach it back in your own words, then review your answers before submitting them for feedback.
7. **Use the feedback to continue.** See what went well, what needs attention and what to try next. Revisit a difficult idea through fresh practice, or continue to the next recommended module.

For example, a learner might want to compare fractions confidently. CuriousNext introduces a clearly defined whole and equal shares, illustrates the idea, asks the learner to apply it, and checks their explanation. If they think a larger denominator always means a larger amount, feedback directs them towards a corrective example and fresh practice.

## Teaching that adapts to your preferences

Explanation depth and visual presentation are separate choices, so choosing simpler language does not lower the assessment criteria.

| Preference | What it changes |
| --- | --- |
| Simple | Uses everyday words, concrete examples and gentle introductions to new terms. |
| Beginner | Explains terminology and works through the idea in guided steps. |
| Standard | Balances explanation, examples and subject detail. |
| Technical | Uses more precise vocabulary and deeper reasoning. |
| Balanced or visually led | Adjusts the emphasis on explanations, diagrams and visual examples. |
| Session duration | Helps shape the proposed scope and pacing of your learning. |

The lesson workspace offers Learn and Explore views, idea-by-idea navigation, a whole-lesson view, transcripts and a readable alternative to interactive visuals. Native scenes include quantities, connected systems, sequences, scenarios and comparisons, alongside number lines, infographics, flowcharts and storytelling. Learners can request another teaching approach, including a simple everyday analogy, while retaining their original lesson, objective and practice criteria. Optional sketch notes save with the learner's work. A contextual AI companion answers questions about the current lesson and retains the conversation with that session. Its assistance is recorded with submitted work.

Read-aloud uses the browser's speech voice to read the slide transcript after the learner chooses to start it. Teach-back dictation uses supported browser speech recognition and lets the learner review and edit recognised words before inserting them into an answer. Browser support and microphone permissions vary, and typed explanations remain available. CuriousNext does not store audio recordings, while the browser's speech service may process audio through its own provider.

## Finding your way around

- **Today** shows “What’s next”, one recommended activity, its reason and a way to continue saved learning. Recent work is available beneath the recommendation.
- **My Path** lists milestones and their purpose, with an optional World map view. Resume a saved lesson or prepare a fresh lesson without replacing earlier work.
- **My Progress** contains Skills and milestones, Practical work and Learning history. Practical work lists saved lesson applications, while a project workspace spanning several milestones remains future work.
- **My account** opens account and teaching preferences. Preference changes apply to future lessons rather than rewriting saved content.

### Walk through the application

1. Sign in and describe a fictional goal, such as comparing fractions or calculating costs for a small food business. Choose explanation depth, visual preference and session length in the same setup flow.
2. Review the generated path and the reasons for its milestones. Clarify the goal if asked, then start learning. The starting-point check is optional and appears within path review.
3. On Today, open the next activity. In the lesson, move between ideas, explore an interactive example or switch to its readable view. Request another explanation or ask the contextual companion a question when needed.
4. Complete the guided practice, then use Apply and submit to enter an application and explain your reasoning. Review the optional answer summary and submit for feedback.
5. Read what went well, what needs attention and the suggested next step. Open My Progress to revisit the saved application, feedback and learning history.

Generation and assessment use configured services and sometimes take time or fail. Keep actual loading and retry states visible during a demonstration. The [earlier captured-screen walkthrough](docs/design-artifacts/goal-first-tutor/demo-script.md) documents saved fictional screens, not a continuous recording of clicks. Stitch exports are static designs, separate from the working application.

## How the project was built

Codex supported implementation, testing and refinement of the application. Google Stitch MCP supported interface design exploration and the [screen handoff](docs/design-docs/screen-handoff.md). Linear tracked development slices and linked them to pull requests through the [project workflow](docs/design-docs/engineering.md#linear-ticket-per-pr). These tools support the development process, while the learner-facing tutor uses the configured OpenAI API.

## Current state

This is a working local and hosted preview for adult learners in English across common educational topics. Bounded fictional journeys have covered fractions, public speaking, introductory Python and phishing awareness. Reference packs cover those introductory topic families, while other generated material remains unreviewed.

The generated tutor includes owned learning paths, optional diagnostic placement, visual teaching, interactive practice, teach-back assessment, corrective practice and recommendations. Successful guided work records **supported practice**, rather than independent mastery or long-term retention. The interactive-teaching work is tracked in [CN-TUTOR-002](docs/exec-plans/active/interactive-teaching.md). The consolidated navigation and contextual companion follow [CN-CLARITY-001](docs/exec-plans/active/clear-learning.md), with measured results and remaining gates recorded in [milestone status](Documentation.md).

When a learner submits work, the application saves the answers, freezes the lesson and criteria used for assessment, then requests feedback. An interruption offers recovery using the same saved submission, and replaying a completed assessment does not create duplicate evidence. Historical lessons and feedback retain their original content and provider fingerprints.

Earlier Practical AI and Cybersecurity pilots remain accessible through their existing links and saved work. They are preserved historical learning engines, rather than the entry point for new goal-first journeys.

## Product boundaries

Generated lessons and assessments still require independent content and provider review before learner release. Fictional integration checks do not establish general topic accuracy or measured learning gains. Actual screen-reader acceptance, the separate M4 scoring questions and hosted release acceptance remain open, while full M5/M6 delivery remains outside this slice.

The current release scope is adults learning in English. Additional teaching languages, public course exploration, publication of reusable courses, uploaded files, conversational voice tutoring, offline synchronisation and a complete portfolio/export experience remain future work. Specialised or consequential goals need clear educational boundaries rather than invented professional expertise.

Private goals and learner answers do not automatically become shared courses. Paths and lessons belong to their learner. Saved lessons are reused for a matching owned module, while request keys prevent a repeated request from creating duplicate work.

## Architecture

| Area | Implementation |
| --- | --- |
| Web application | Next.js and React, with the paper, ink, lime and lavender CuriousNext design. |
| Identity | Better Auth sessions with personal email magic links or explicitly enabled shared demo access. |
| Persistence | Neon PostgreSQL and Drizzle, using additive migrations and revision checks. |
| Generation and assessment | Private server-side OpenAI configuration with validated structured outputs. |
| Learning decisions | Deterministic placement, evidence and recommendation rules, separate from generated wording. |
| Visual and speech controls | Native HTML/CSS components and optional browser speech APIs, without generated executable code. |
| Email and hosting | Resend and Vercel support the delivery setup, with hosted release acceptance still open. |

Lesson content, assessment criteria, reference snapshots and provider configuration are pinned so later generation does not rewrite earlier evidence. Historical Groq results remain preserved, and no automatic model fallback is used.

## Application setup and deployment

Use Node.js 24 and a configured isolated PostgreSQL database, then install the locked dependencies and create your private local configuration.

```sh
npm ci
cp .env.example .env.local
```

Configure the values documented in `.env.example`, including the database connection, a random `BETTER_AUTH_SECRET` of at least 32 characters, and an exact `BETTER_AUTH_URL` matching your browser origin. Keep `AI_PROVIDER=openai`, `OPENAI_API_KEY` and the configured `OPENAI_MODEL` on the server, and never commit real credentials.

Apply the reviewed migrations explicitly before starting against a new isolated database:

```sh
node --env-file=.env.local scripts/migrate-local.mjs
npm run dev
```

The migration script records checksums and skips matching applied migrations. Existing schemas without its migration ledger require manual review, and application startup never performs migrations. The current sequence is [0001 authentication](migrations/0001-access.sql), [0002 course plans](migrations/0002-course-plans.sql), [0003 preferences](migrations/0003-enrollment-preferences.sql), [0004 attempts](migrations/0004-attempt-loop.sql), [0005 retention](migrations/0005-retention-modes.sql), [0006 generated paths](migrations/0006-generated-tutor.sql), [0007 lessons](migrations/0007-tutor-lessons.sql), [0008 request binding](migrations/0008-tutor-lesson-requests.sql) and [0009 submission uniqueness](migrations/0009-tutor-submissions.sql).

Open http://127.0.0.1:3000 and follow the sign-in journey to `/onboarding`. Missing service configuration produces unavailable feedback rather than a simulated successful response. Installation does not create service accounts, credentials or paid resources.

For local fictional sign-in, set `EMAIL_DELIVERY=local` and `BETTER_AUTH_URL=http://127.0.0.1:3000`, then use `/access` and the development-only `/dev/mail` inbox to open and confirm a test link. This creates a real test session without proving ownership of a real mailbox. The ignored `.local-mail/` directory and development inbox must remain private, bound to loopback and unavailable in production.

Hosted release requires configured email delivery, separate migration/application database roles, HTTPS, ownership/privacy checks and the outstanding acceptance gates. See the [deployment runbook](docs/design-docs/deployment.md), [stack decision](docs/design-docs/decisions/002-neon-pilot-stack.md) and [local email decision](docs/design-docs/decisions/004-local-email-preview.md).

### Temporary shared demo login

Set `DEMO_LOGIN_ENABLED=true` and a private `DEMO_LOGIN_PASSWORD` of at least 16 characters to replace email sign-in with a shared demo password. The account is created automatically on first sign-in, while normal secure sessions and logout remain active. Resend configuration is unnecessary in this mode. The configured password is intentionally displayed on the login page while demo mode is enabled, allowing anyone with the link to test. Everyone shares the demo account and saved work, so use fictional information only. Existing personal accounts remain stored but cannot sign in through email until demo mode is disabled. Remove the flag to restore email login, which requires real email delivery on hosted deployments. Never publish the password in source control.

## Run repository checks

Use Python 3.12 and Node.js 24, matching CI. Python governance checks use the standard library, while the application suite uses disposable PGlite databases and test-only captured mail rather than live Neon or email delivery.

```sh
python3 scripts/validate_repo.py
python3 -m unittest discover -s tests
python3 scripts/validate_design_artifacts.py
python3 scripts/validate_calibration.py
npm run check
python3 scripts/validate_build_privacy.py
npm audit --audit-level=high
```

Live provider checks are separate, explicitly enabled fictional studies with new output filenames and preserved failures. They do not replace independent curriculum or assessor review. Historical pilot operators and results remain in `scripts/` and `docs/design-artifacts/`, with their scope recorded in [milestone status](Documentation.md).

After reviewing documentation changes, run `python3 scripts/validate_repo.py --refresh` and commit the updated fingerprints. Development slices follow the [engineering workflow](docs/design-docs/engineering.md), with reviewed, ticket-linked PRs and passing latest-commit checks.

## Start here

- [Product contract](Prompt.md) explains the learning goals, behaviour and evidence boundaries.
- [Milestone status](Documentation.md) records what has been implemented, tested and left open.
- [Goal-first tutor plan](docs/exec-plans/active/goal-first-tutor.md) and [interactive teaching plan](docs/exec-plans/active/interactive-teaching.md) describe the current delivery.
- [Architecture](Architecture.md), [API](docs/design-docs/api-spec.md), [data model](docs/design-docs/data-model.md) and [security](docs/design-docs/security.md) describe implementation boundaries.
- [Design system](docs/DESIGN.md), [screen behaviour](docs/FRONTEND.md) and [learner journeys](docs/product-specs/user-flows.md) provide design context, including preserved pilot history.
- [Roadmap](Plans.md), [implementation entry](Implement.md), [repository map](AGENTS.md), [plans](docs/exec-plans/index.md) and [decisions](docs/design-docs/decisions/index.md) guide contributors.
