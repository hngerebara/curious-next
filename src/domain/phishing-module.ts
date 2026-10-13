import type { AttemptMode, Draft, Task, ExplanationLevel } from "../contracts/attempt";

import { choices } from "../contracts/simulation";
export const completeSimulation = (draft: Draft) => !!choices(draft.prompt) && !!draft.checklist.trim() && !!draft.explanation.trim();
export function phishingTask(mode: AttemptMode, scenario: number): Task {
  if (mode !== "practice" && scenario >= 12) throw new Error("FRESH_TASKS_EXHAUSTED");
  const transfer = mode === "transfer";
  const practice = mode === "practice";
  const service = practice ? "ParcelPoint" : transfer ? `CareerConnect ${scenario+1}` : `StudyHub ${scenario+1}`;
  const family = practice ? "delivery" : transfer ? "recruitment" : "account-security";
  const accountRequests = [
    "Your account will close in 30 minutes. Sign in immediately using this message's link.",
    "Your membership will close today. Pay an unexpected reactivation fee immediately through this message's link.",
    "Your profile will be removed in one hour. Upload identity documents through this message's link immediately.",
    "Your account will be locked today. Reply with your password immediately to keep access.",
    "Your subscription will be cancelled in 15 minutes. Confirm payment details through this message's link now.",
    "Your study records will be deleted today. Sign in through this message's link to stop deletion.",
    "Your course access ends in 20 minutes. Pay an unexpected verification fee through this message's link.",
    "Your profile is under urgent review. Reply with private account recovery information today.",
    "Your saved notes will be removed tonight. Send your password in reply immediately.",
    "Your membership requires urgent identity checks. Upload private documents through this message's link today.",
    "Your account is suspended. Enter payment information through this message's link within 10 minutes.",
    "Your course enrollment will be revoked today. Sign in through this message's link immediately.",
  ];
  const recruitmentRequests = [
    "You have been offered an unexpected job. Upload your identity documents immediately to keep this offer.",
    "An unexpected employer offers immediate placement. Pay a registration fee through this message's link today.",
    "A job offer expires in 15 minutes. Reply with private account recovery information to accept it.",
    "An unexpected recruiter requests urgent identity verification. Upload personal documents through this message's link.",
  ];
  const request = practice ? "You have no expected parcel. Your parcel will be returned in 30 minutes. Pay a redelivery fee." : transfer ? recruitmentRequests[scenario % recruitmentRequests.length] : accountRequests[scenario];
  return { version: `${family}-${practice ? "practice" : scenario}-v3`, family, objectiveId: "CY-2", rubricVersion: "CY-2-v2", policyVersion: "pilot-v1", status: "preview", title: `${service}: fictional message decisions`,
    source: `Simulation only. You ${practice ? "have no expected delivery" : transfer ? "have an existing recruitment-service account and expected a saved-search reminder" : "have an existing study-service account and expected a study reminder"}. You already use the official ${service} app. Its Help → Report suspicious message route is known. The sensitive request is unexpected. Neither message is conclusively authenticated. All destinations are inert fictional text.`,
    brief: "Choose actions for both messages and explain each decision. Identify what the evidence supports, what remains unknown, an independent verification route and when/where you would report. Explain what familiar branding establishes. Do not enter real credentials or personal data. A fictional .example suffix is not a scored phishing cue.",
    messages: [{id:"request",displayName:service,sender:`notice@${family}-check.example`,text:request,destination:`${family}-check.example`},{id:"routine",displayName:service,sender:`reminders@${family}.example`,text:transfer ? "Your saved job search has new results. No sensitive information is requested." : practice ? "A delivery status update. No payment or sign-in is requested." : "Your planned study session is today. No sign-in or sensitive information is requested.",destination:"No destination or sensitive action requested"}],
    criteria: [
      {id:"C1",title:"Evidence",standard:"Identify the unexpected sensitive request and urgency, threat or scenario mismatch. Suspicion is not conclusive proof.",remediation:"Inspect the request and context."},
      {id:"C2",title:"Safe action",standard:"Avoid the message link and sending sensitive information for both messages.",remediation:"Practise safer responses."},
      {id:"C3",title:"Verification",standard:"Verify the unexpected request through a pre-established independent trusted route.",remediation:"Practise independent-channel verification."},
      {id:"C4",title:"Reporting",standard:"Name the known in-app reporting route when suspicion persists.",remediation:"Review the known reporting route."},
      {id:"C5",title:"Reasoning",standard:"Explain why branding does not authenticate a sender and why suspicion is not proof.",remediation:"Compare appearance with evidence."},
      {id:"C6",title:"Generalisation",standard:"Treat the routine message according to its lower-risk context without claiming certainty.",remediation:"Compare contrasting messages."},
    ] };
}
export function phishingLesson(level: ExplanationLevel) {
  const core = "Fictional simulation. Phishing asks you to take an unsafe action while pretending to be trustworthy. Inspect the requested action and whether it matches your situation. Branding, polished wording and a secure connection do not authenticate the sender. Pause and verify unexpected sensitive requests through a route you already trust. Report persistent suspicion through the known service channel. An urgent message is not automatically fraudulent.";
  const wording = {"very-simple":"Ask: what does this message want me to do? Open the app you already know yourself, rather than using a message link.",beginner:"Independent verification means using an app or contact route you already trusted before receiving this message.",standard:"Separate suspicious cues from proof. Explain remaining uncertainty and select actions suited to each message's context.",technical:"Distinguish sender authenticity, transport security and action risk. Use an independently established channel and preserve uncertainty."};
  return core + "\n\n" + wording[level];
}
export const phishingHelp = (kind: "hint" | "worked_solution") => kind === "hint" ? "Inspect the requested action and its context. Does a familiar display name establish who sent it? Which route did you already trust before receiving the message?" : "Worked support: pause an unexpected sensitive request. Open the established official app yourself, check there and use its known reporting route for persistent suspicion. Familiar branding does not authenticate a sender. A routine reminder requires no sensitive action and is not conclusively authenticated either. Apply the reasoning to your own fictional task.";
