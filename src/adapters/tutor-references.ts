import type { TutorReference } from "../contracts/tutor-lesson";
export const tutorReferences:TutorReference[]=[
  {
    "id": "fractions-openstax",
    "title": "Visualize Fractions, OpenStax",
    "url": "https://openstax.org/books/prealgebra-2e/pages/4-1-visualize-fractions",
    "summary": "A fraction describes selected equal parts of a whole, with the denominator counting all equal parts and the numerator counting selected parts. Comparisons require attention to the whole being represented.",
    "accessedAt": "2026-10-14",
    "snapshotHash": "eab687abc147c48c9919f15e4cbe5c5922cfd60a29edfec440daa2fc5369066f",
    "review": "agent-reviewed"
  },
  {
    "id": "python-introduction",
    "title": "An Informal Introduction to Python",
    "url": "https://docs.python.org/3/tutorial/introduction.html",
    "summary": "Python supports arithmetic expressions, named values and text strings, while comments explain code without being executed. Division and integer division produce different results, and string indexing selects individual characters.",
    "accessedAt": "2026-10-14",
    "snapshotHash": "310d0ecdfafc36e6c787c03b39a6fa246cc31dae1136367c44d1f7827b53a862",
    "review": "agent-reviewed"
  },
  {
    "id": "phishing-cisa",
    "title": "Recognize and Report Phishing, CISA",
    "url": "https://www.cisa.gov/secure-our-world/recognize-and-report-phishing",
    "summary": "Suspicious messages deserve caution when they request urgent action or personal information. Avoid supplied links and attachments, contact the organisation independently when necessary, and report suspicious messages before deleting them.",
    "accessedAt": "2026-10-14",
    "snapshotHash": "ab3f82b1b46f096bd60bad45b61d83d60303a2b2b75a798e1cb89cc29426793e",
    "review": "agent-reviewed"
  },
  {
    "id": "speaking-purpose",
    "title": "Specific Purposes, Stand up Speak out",
    "url": "https://saylordotorg.github.io/text_stand-up-speak-out-the-practice-and-ethics-of-public-speaking/s09-04-specific-purposes.html",
    "summary": "A useful speech purpose connects a topic, audience and intended outcome. Narrow the topic to what the audience needs, and explain why that purpose matters for the particular speaking situation.",
    "accessedAt": "2026-10-14",
    "snapshotHash": "550d134a37ccc87f1e41199640c14f4c2f2c0f1673d00407faf42797218a009d",
    "review": "agent-reviewed"
  }
];
export function tutorReferencePack(goal:string):TutorReference[] {
  const text=goal.toLowerCase();return tutorReferences.filter(r=>r.id.startsWith("fractions")?/fraction|math|arithmetic|numerator|denominator/.test(text):r.id.startsWith("python")?/python|programming|code|coding/.test(text):r.id.startsWith("speaking")?/speaking|presentation|speech|communication/.test(text):r.id.startsWith("phishing")?/phish|scam|cyber|digital safety/.test(text):false);
}
