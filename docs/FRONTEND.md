# CuriousNext frontend guidance

## Boundaries

UI imports application and contracts, never provider/storage adapters. Bootstrap composes implementations. The frontend stack remains an M1 decision. Do not treat this document as evidence of an implemented UI.

## Required behavior

Support keyboard/screen-reader journeys, mobile reflow, accessible authentication and status announcements. Preserve draft save status and errors. Show pending/uncertain assessments honestly. Separate practice AI and learning assistance. Escape submitted text and make simulated links inert. Announce completed messages rather than every streamed token.

Validate rendered journeys and accessibility alongside behavior tests. [Architecture](../Architecture.md), [design](DESIGN.md), [pilot](product-specs/pilot-design.md).
