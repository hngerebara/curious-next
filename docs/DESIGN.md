# CuriousNext design system

## Status and reference provenance

Version 0.2, 2026-10-07. Proposed implementation specification, not a rendered or usability-validated interface. This document owns visual tokens, component appearance and presentation intent. [Frontend guidance](FRONTEND.md) owns implementation behavior, [pilot design](product-specs/pilot-design.md) owns learning policy.

The requested Curious Tech Girl post skill was not found in the installed skill directories. Its file path or reference posts are pending. Do not describe the proposed palette, typography or illustrations as verified Curious Tech Girl branding. Incorporate approved brand assets after direct review, keeping the learning and accessibility rules intact.

## Design intent

A welcoming adult learning workspace with a clear next step and room to think. Express curiosity through thoughtful questions, annotated examples and small moments of discovery. Avoid childish characters, decorative complexity, leaderboard pressure and implied expertise from progress graphics.

Use an editorial lesson hierarchy with concise section labels, clear headings, readable paragraphs and lightweight diagrams. The home screen answers what to do next and why. A course overview remains available, but does not compete with the primary recommended action. Practical AI and Cybersecurity share the same system, differentiated by labelled course icons and examples rather than separate visual identities.

## Colour tokens

Light theme is the pilot default. Do not advertise a dark theme until it is specified and checked. Use opaque colours for core text and controls.

| Token | Value | Purpose |
|---|---|---|
| canvas | #FAF9F6 | Warm page background |
| surface | #FFFFFF | Navigation, inputs and secondary cards |
| ink | #172B3A | Headings and primary text |
| ink-muted | #52616B | Supporting text and metadata |
| action | #F6C74D | Primary action with ink text |
| action-hover | #E8B733 | Hover on enabled primary action |
| link | #285F85 | Links, selected navigation text, focus |
| learning-surface | #EAF3F7 | Next-action and worked-example cards |
| border-subtle | #D6DFE3 | Decorative separators only |
| border-control | #71828D | Input and interactive control boundaries |
| success-ink | #226347 | Demonstrated state text/icon |
| success-surface | #EAF5EE | Demonstrated state background |
| review-ink | #81530B | Needs-review state text/icon |
| review-surface | #FFF4D6 | Needs-review state background |
| error-ink | #A52A32 | Error text/icon |
| error-surface | #FCEEEF | Error background |

Use ink on action, ink/link on learning-surface, and state ink on its matching surface. Do not place white text on yellow or use border-subtle as the sole input outline. Colour is always paired with a label, icon or pattern. Focus uses a 3px link outline with a 2px contrasting surface offset. Contrast must be verified for actual rendered states, including hover, disabled and focus. These tokens are not a conformance claim.

## Typography

Use a self-hosted Noto Sans variable font when available, with system-ui and sans-serif fallbacks. Verify the actual font files and rendering of Igbo/Yoruba diacritics, Hausa characters and Nigerian Pidgin punctuation. Never remove accents to fit a layout. Use the same readable family for headings and body until approved brand typography exists.

| Role | Desktop | Mobile | Weight / line height |
|---|---|---|---|
| Page title | 36px | 28px | 700 / 1.2 |
| Section heading | 24px | 22px | 650 / 1.3 |
| Card heading | 20px | 20px | 650 / 1.35 |
| Lesson body | 18px | 18px | 400 / 1.65 |
| UI body | 16px | 16px | 400 / 1.5 |
| Metadata | 14px | 14px | 500 / 1.5 |

Use rem units, user scaling and flexible heights. Lesson measure is 60-70 characters. Uppercase labels are short navigational metadata only. Translated headings use natural case unless language review approves otherwise. No justified paragraphs or long passages in capitals. Inline technical text uses a readable monospace fallback and wraps safely.

## Layout and spacing

Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px. Default card padding is 24px desktop and 16px mobile. Control gap is at least 8px. Use 12px input/button radius and 20px prominent learning-card radius. Borders establish surfaces, with shadows limited to overlays and optional subtle navigation separation.

Desktop shell at 1024px and above: 240px sidebar, 64px header, flexible main area capped at 1120px. Lessons cap at 760px. Practice optionally pairs the brief and work area when space permits. At narrower widths the sidebar becomes an accessible drawer and content stacks. Main padding is 24px at tablet and 16px on small screens.

Core flows reflow at 320 CSS pixels and remain usable at 200% text resize and 400% zoom. Do not use fixed content heights. Long labels wrap, and translations have no line-count cap. Dialogs scroll within the viewport while keeping dismiss controls reachable. Touch controls target at least 44 by 44 CSS pixels.

## Navigation and screen composition

Navigation contains Learn, My courses and Evidence. Course detail exposes modules and relevant review/misconceptions contextually. Preferences and language are labelled in the account area. Keep study tools contextual rather than adding separate destinations for every feature.

Home: goal context → one next-action card → evidence-based reason → Start action → time choices (10/20/40 minutes) → up to two alternatives. Estimates are labelled and do not become countdowns. Keep due review visible without turning home into a dashboard of scores.

Onboarding: one question group at a time, with progress through setup steps and Back. Language and explanation level are distinct controls. Course suggestions show outcome, relevance and prerequisites. Diagnostic and Start from the beginning are both visible, with no implied penalty for skipping.

Course overview: outcome, ordered modules, current placement, individual capability labels and reasons. A suggested starting module does not show prerequisites as completed. Do not use one combined mastery ring.

Lesson: objective → explanation → annotated example → optional alternative explanation → practice. Keep the help control near content without obscuring it. A visual and its equivalent structured description provide the same instructional information.

Practice: labelled brief, editable workspace, response history and contextual assistance. The Practice AI panel and Learning assistant panel have distinct headings and purposes. On mobile, use stacked sections rather than shrinking two columns. Show draft-save and generation status.

Independent task: visible objective and expected output, neutral allowed-tools guidance, submission and teach-back fields. Practical AI remains available where the task expects it. Substantive learning-assistant help creates an explicit assisted status, following pilot policy. Accessibility support does not.

Feedback: assessment status → criterion results with evidence → specific gap or misconception → recommended next action. Use plain labels such as Met, Needs work and Unable to assess, not a celebratory percentage alone.

Evidence: objective, original demonstration, later recall, transfer, assistance, criteria, date and artifact. Display these as readable rows/sections with a chronological detail view. Export has the same honest assessment labels.

## Component vocabulary

Next-action card: pale learning-surface, small action-type label, task heading, objective, estimate, short reason, one primary button. Alternatives are quieter surface rows.

Primary button: yellow with dark text, verb-based label, optional trailing icon. One dominant action per screen region. Secondary button: surface with border-control. Text links are underlined in prose. Disabled controls explain unmet conditions where relevant.

Capability badge: status word plus a shape/icon and accessible name. Not assessed is neutral, Developing is blue, Demonstrated is green, Needs review is amber. Supporting detail explains the evidence. Pending or failed assessment is an attempt state, not a fabricated capability award.

Example card: source content, learner task or prompt, and relevant annotation. Annotation markers pair with a numbered text list. Phishing annotations expose neutral fields and never highlight the correct answer during assessment.

Explanation control: labelled menu of simpler explanation, example, visual, deeper explanation and contextual help. No silent default preference change.

Message history: ordered list with speaker, content and status. Avoid typing indicators that imply the model is thinking like a person. Announce message completion once, not each token. Loading text says Generating response or Assessing submission.

Feedback criterion row: criterion name, result, evidence and next practice link where needed. Do not hide explanation behind colour or hover.

## Illustration and visual teaching

Prefer HTML/SVG diagrams for editable labels, crisp scaling and translated content. Use thin consistent line icons with text labels. Decorative images have empty alternatives. Complex graphics need full structured descriptions, not merely a short alt label.

Practical AI visuals: prompt anatomy, brief-to-output flow, source comparison and revision before/after. Cybersecurity visuals: neutral message anatomy, trusted-channel decision paths and account-setting simulations. Keep all simulated links inert.

No visual puzzle is necessary to demonstrate a nonvisual learning objective. Accessible task representations expose equivalent facts without adding answer hints. Do not make a learner identify red boxes or drag items as the only answer method.

## Language and accessible presentation

Supported release targets: English, Nigerian Pidgin, Igbo, Yoruba and Hausa. Show reviewed availability per course/module. Language selectors use names, not flags. Exact local-language labels and technical glossaries require fluent-speaker approval. English technical terms may accompany an explanation when reviewed and useful.

Allow switching language without losing the draft. Preserve original-language submissions and code-switching. Translated feedback retains criterion identifiers and standards. Do not silently fall back to English or treat translation uncertainty as learner failure.

Use semantic headings, landmarks, skip links, accessible labels and logical focus order. Every overlay supports keyboard close and focus restoration. Large text and screen-reader presentation are available without disclosure of a disability. In-app narration remains deferred until voice/pronunciation verification. Existing assistive speech works independently of that feature.

## Motion, states and copy

Use 120-180ms opacity or colour transitions for small feedback. Respect reduced motion. No looping decorations, autoplay audio, confetti or progress animation implying unearned mastery.

Empty state: explain missing evidence and offer a useful start. Interrupted network: preserve the last confirmed draft, show save status and retry. Generation failure: retain the prompt and offer retry. Assessment failure/uncertainty: preserve submission, show honest status, offer retry or optional review. Never replace pending results with a guessed grade.

Copy is direct, respectful and specific. Prefer “Your answer explains the goal but misses the source constraint” to “You failed.” Prefer “Scheduled for review” to claims of knowing when the learner will forget. Success celebrates demonstrated work without claims about job readiness. Localised copy needs natural-language review.

## Implementation and design validation

Before release, render onboarding, home, lesson, practice, independent task, feedback and evidence at desktop and narrow/mobile widths. Validate long translated labels, accents and fallback fonts. Check keyboard-only operation, screen-reader reading order, focus visibility, zoom/reflow, contrast and reduced motion.

Test with blind and low-vision learners. Verify diagram/text equivalence and assessment parity. Screenshots and automated scans alone are insufficient. No interface has yet been built or validated against this specification.

Brand-source review remains pending for the requested Curious Tech Girl skill/posts. After receipt, record observed brand traits separately from proposed adaptations and update tokens deliberately. Do not import social-post density or image-only typography into lessons.

Related documents: [product contract](../Prompt.md), [curriculum](curriculum/index.md), [frontend](FRONTEND.md), [document ownership](design-docs/document-ownership.md).
