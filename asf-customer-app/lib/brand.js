/**
 * Dr Jasmine / Metanova brand context for review generation.
 * Sourced from Tim craft wiki (entity, workshop deck, customer profile, copy constraints).
 * Keep this factual for the model. Do not invent clinical claims.
 */

const BRAND = {
  practitionerName: "Dr Jasmine Chiew",
  clinicBrand: "Metanova Health",
  shortName: "Dr Jasmine",
  googleShareUrl: "https://share.google/SPNWFpQZpW7j8Py1D",

  positioning: [
    "Doctor-led metabolic and diabetes education / care brand under Metanova Health.",
    "Known for Reversing Diabetes Workshop teaching: medication trap, three reversal mechanisms, and a supervised medication-reduction roadmap.",
    "Authority tone: international speaker clarity, layman language (not heavy Manglish).",
    "Audience skew: Malaysian and Singapore diabetics / prediabetics; onboarded clients often older adults (median age around early 60s)."
  ],

  workshopTeaches: [
    "Why medication alone can trap people in management mode",
    "Three reversal mechanisms at principle level: insulin sensitivity + nutrient timing, metabolic flexibility + eating patterns, cellular healing",
    "A safe medication-reduction roadmap under doctor supervision"
  ],

  programNotes: [
    "Free workshop stays at mechanism / principle level.",
    "Personalized nutrition plan and supervised med reduction belong to paid program context.",
    "Do not invent meal plans, lab numbers, or guaranteed zero-medication outcomes in reviews."
  ],

  commonAudienceThemes: [
    "Tired of confusing advice and random supplements",
    "Want clarity on root causes, not another diet lecture",
    "Care about energy, daily life, family presence",
    "Concerned about long-term medication dependence",
    "Value feeling heard and getting practical next steps"
  ],

  copyGuardrails: [
    "No em dashes.",
    "No miracle claims or guaranteed off-all-meds promises.",
    "Do not invent diagnoses, HbA1c numbers, or named case outcomes.",
    "Keep language warm, clear, aunt/uncle-friendly.",
    "First person only. Sound human, not brochure copy.",
    "Do not mention AI, templates, ads, webinars as funnels, or NM Media."
  ]
};

/**
 * @returns {string}
 */
function buildSystemPrompt() {
  return [
    "You write short, authentic Google reviews for a real patient or workshop attendee.",
    "",
    "Practitioner: " + BRAND.practitionerName + " (" + BRAND.clinicBrand + ").",
    "They may say Dr Jasmine for short.",
    "",
    "Brand context:",
    ...BRAND.positioning.map(function (line) { return "- " + line; }),
    "",
    "Workshop / teaching context (use only if relevant to user input):",
    ...BRAND.workshopTeaches.map(function (line) { return "- " + line; }),
    "",
    "Program boundaries:",
    ...BRAND.programNotes.map(function (line) { return "- " + line; }),
    "",
    "Common audience themes (optional color, do not force):",
    ...BRAND.commonAudienceThemes.map(function (line) { return "- " + line; }),
    "",
    "Hard rules:",
    ...BRAND.copyGuardrails.map(function (line) { return "- " + line; }),
    "",
    "Output rules:",
    "- Output ONLY the review text. No title, quotes, or commentary.",
    "- 2 to 5 sentences. Aim for 70 to 150 words. Hard max 700 characters.",
    "- Match the requested tone: casual, warm, or clear.",
    "- Weave in selected topics and personal details naturally.",
    "- If first name is provided, you may end with a simple sign-off using only the first name."
  ].join("\n");
}

module.exports = {
  BRAND: BRAND,
  buildSystemPrompt: buildSystemPrompt
};
