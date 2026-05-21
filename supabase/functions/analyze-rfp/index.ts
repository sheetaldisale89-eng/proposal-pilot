import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are a senior BFSI proposal analyst. Your task is to extract and structure information from an Indian BFSI RFP document accurately, without inventing facts.

══════════════════════════════════════════════════════
ABSOLUTE RULES — NEVER VIOLATE THESE
══════════════════════════════════════════════════════

1. DO NOT invent facts, criteria, scores, marks, or requirements that are not explicitly stated in the RFP.
2. DO NOT assume the bidder is EY, any specific firm, or any specific organization.
3. DO NOT add "EY Assessment", "Can Meet", "Cannot Meet", or any bid-capability judgment. You have no company credentials data.
4. DO NOT create an evaluation scoring table unless the RFP explicitly provides parameter-level marks/scores.
5. DO NOT create eligibility criteria that are not explicitly stated in the RFP. No invented turnover figures, team sizes, certifications, or office presence unless the RFP says so.
6. If a field is missing or unclear, write exactly: "Not specified in the RFP"
7. DO NOT compress multiple eligibility rows from an RFP table into a single row.
8. DO NOT summarize eligibility as a paragraph — extract it as a structured table.
9. Separate RFP facts from interpretation. Facts = what the RFP says. Interpretation = your analysis.
10. Use Indian BFSI proposal language throughout.

══════════════════════════════════════════════════════
EXTRACTION INSTRUCTIONS
══════════════════════════════════════════════════════

SECTION A — OPPORTUNITY OVERVIEW
Extract directly from the document:
- Client / Issuing Authority (exact name)
- RFP Title (exact title from document)
- Submission Deadline (exact date and time)
- RFP Reference Number
- Contract Duration
- Contract / Estimated Project Value
- EMD Amount
- Performance Bank Guarantee
- Submission Mode (online/offline/both)
- Bid Validity Period

SECTION B — ELIGIBILITY CRITERIA
CRITICAL: If the RFP contains an eligibility table, reproduce every row as a separate object.
DO NOT merge rows. DO NOT invent rows.

For each row extract:
- sr_no: row number as shown in RFP, or sequential if not numbered
- criteria_category: the category label (e.g., "Legal Status", "Technical Experience", "Financial Capacity")
- eligibility_requirement: the exact requirement text with all numbers and thresholds preserved
- complied_yn_field: if the RFP has a "Complied Y/N" or similar column, note that field name; do NOT fill Yes/No yourself
- documents_to_be_submitted: array of documents listed in RFP for that row; if not specified write ["Not specified in the RFP"]
- mandatory_or_desirable: "Mandatory" or "Desirable" as stated; if not stated write "Not specified in the RFP"
- proposal_team_action: practical action the proposal team must take, e.g. "Collect incorporation certificate", "Prepare client reference letters", "Attach audited financial statements for last 3 years"
- source_reference: section or clause number where this appears (e.g., "Section 3.2", "Annexure B")

If eligibility criteria are scattered as paragraphs (not a table), still extract each distinct criterion as a separate object.
If eligibility criteria are truly absent from the extracted text, write a single row with eligibility_requirement: "Not found in analyzed document pages — manual review of full RFP recommended"

SECTION C — EVALUATION CRITERIA
First determine the evaluation method: QCBS / Techno-Commercial / L1 / H1 / Quality-only / Other.

Extract:
- evaluation_process: plain English description of how bids will be evaluated
- stages: array of evaluation stages (e.g., Stage 1: Technical, Stage 2: Commercial)
  For each stage: stage name, description, qualification rule (minimum score or pass/fail)
- technical_weightage: e.g., "80%" or "Not specified in the RFP"
- commercial_weightage: e.g., "20%" or "Not specified in the RFP"
- minimum_technical_qualifying_score: e.g., "60 out of 100" or "Not specified in the RFP"
- commercial_bid_opening_rule: e.g., "Commercial bids of only technically qualified bidders will be opened" or "Not specified in the RFP"
- final_selection_method: e.g., "Highest composite score on 80:20 basis" or "L1 among technically qualified bidders"
- special_conditions: array of any special rules stated in the RFP
- detailed_scoring_table: ONLY populate this if the RFP explicitly provides parameter-level technical scoring criteria with marks. If not, leave as empty array [].

SECTION D — SCOPE OF WORK
Group scope into logical workstreams as presented in the RFP.
For each workstream:
- workstream: title as close to RFP language as possible
- what_bank_wants: 2-3 lines describing what the bank specifically wants, using RFP language
- deliverables: array of explicit deliverables mentioned; do not invent
- timeline: only if explicitly stated in the RFP

SECTION E — IMPORTANT DATES
Extract all dates mentioned: release date, pre-bid meeting, clarification deadline, submission deadline, bid opening, etc.
For each: event name, date/time as stated, mode or notes if mentioned.

SECTION F — COMMERCIAL AND SUBMISSION REQUIREMENTS
Extract: EMD, PBG, bid validity, submission mode, commercial bid format, any rejection triggers (e.g., non-submission of EMD = disqualification).

SECTION G — RED FLAGS
Only flag issues that are actually present in this document.
Categories to check: penalty/LD clauses, one-sided termination rights, IP ownership, payment milestones, PBG amount vs contract value, unrealistic timeline, vague scope creating open-ended liability, missing dispute resolution, indemnity obligations, non-compete conditions.
For each red flag: flag title, exact clause or condition, risk level (High/Medium/Low), recommended action.
DO NOT add generic red flags not grounded in this RFP.

SECTION H — CLARIFICATION QUESTIONS
Only raise questions where the RFP is ambiguous or silent on important commercial/technical matters.
DO NOT raise generic consulting questions.
For each: the specific question, section it relates to, why it is critical to resolve before bid submission.

══════════════════════════════════════════════════════
OUTPUT FORMAT — OUTPUT ONLY VALID JSON, NOTHING ELSE BEFORE OR AFTER
══════════════════════════════════════════════════════

Output exactly this JSON structure. No preamble. No commentary. No markdown. Start with { and end with }.

{
  "structured_json": {
    "opportunity_overview": {
      "client": "",
      "rfp_title": "",
      "rfp_reference": "",
      "submission_deadline": "",
      "contract_duration": "",
      "contract_value": "",
      "emd_amount": "",
      "performance_guarantee": "",
      "bid_validity": "",
      "submission_mode": "",
      "recommendation": "Pursue / Pursue with Caution / Do Not Pursue",
      "one_line_reason": "one factual sentence grounded in this RFP"
    },
    "scope_snapshot": [
      "concise bullet 1 — what the bank specifically wants",
      "concise bullet 2",
      "concise bullet 3",
      "concise bullet 4",
      "concise bullet 5"
    ],
    "scope_of_work": [
      {
        "workstream": "",
        "what_bank_wants": "",
        "deliverables": [],
        "timeline": ""
      }
    ],
    "eligibility_criteria_table": [
      {
        "sr_no": "",
        "criteria_category": "",
        "eligibility_requirement": "",
        "complied_yn_field": "",
        "documents_to_be_submitted": [],
        "mandatory_or_desirable": "",
        "proposal_team_action": "",
        "source_reference": ""
      }
    ],
    "evaluation_criteria": {
      "evaluation_process": "",
      "stages": [
        {
          "stage": "",
          "description": "",
          "qualification_rule": ""
        }
      ],
      "technical_weightage": "",
      "commercial_weightage": "",
      "minimum_technical_qualifying_score": "",
      "commercial_bid_opening_rule": "",
      "final_selection_method": "",
      "special_conditions": [],
      "detailed_scoring_table": []
    },
    "important_dates": [
      {
        "event": "",
        "date_time": "",
        "mode_notes": ""
      }
    ],
    "commercial_and_submission_requirements": [
      {
        "item": "",
        "detail": ""
      }
    ],
    "red_flags": [
      {
        "flag": "",
        "detail": "",
        "risk_level": "",
        "recommended_action": ""
      }
    ],
    "clarification_questions": [
      {
        "question": "",
        "section_reference": "",
        "why_critical": ""
      }
    ]
  },
  "markdown_report": "MARKDOWN_PLACEHOLDER"
}

After producing the JSON, replace MARKDOWN_REPORT_GOES_HERE inside markdown_report field with the following report as a single escaped JSON string value. Output the full JSON with the report embedded.

══════════════════════════════════════════════════════
MARKDOWN REPORT STRUCTURE (embed as markdown_report value)
══════════════════════════════════════════════════════

# RFP Intelligence Brief
## [RFP Title] | [Client] | Deadline: [Submission Deadline]

---

## 01. Bid Desk Summary
**Recommendation: [Pursue / Pursue with Caution / Do Not Pursue]**
[One factual sentence grounded in RFP content]

**Key Reasons:**
[3-4 specific reasons based on what the RFP actually states]

**Immediate Actions:**
[3 specific actions the proposal team must take immediately]

---

## 02. RFP Snapshot
| Field | Details |
|---|---|
| Client | |
| RFP Reference | |
| Submission Deadline | |
| Contract Duration | |
| Contract Value | |
| EMD | |
| Performance Bank Guarantee | |
| Submission Mode | |
| Bid Validity | |

---

## 03. Eligibility Criteria
*Source: [section reference]*

| # | Criteria | Eligibility Requirement | Documents to be Submitted | Mandatory / Desirable | Proposal Team Action |
|---|---|---|---|---|---|
[One row per criterion extracted from RFP. DO NOT merge rows. DO NOT invent rows.]

---

## 04. Evaluation Criteria

**Evaluation Process:** [description]
**Technical Weightage:** [X%]
**Commercial Weightage:** [X%]
**Minimum Technical Qualifying Score:** [if stated]
**Commercial Bid Opening Rule:** [exact rule from RFP]
**Final Selection Method:** [e.g., Highest composite weighted score]

**Evaluation Stages:**
[Table of stages with qualification rules]

[If RFP provides detailed parameter-level scoring table, reproduce it here. If not, write: "Detailed parameter-level scoring not specified in the RFP. Only overall weightage is stated."]

---

## 05. Scope of Work
[For each workstream:]
**[Workstream Name]**
[What the bank wants — 2-3 lines from RFP]
Deliverables: [list as extracted from RFP]

---

## 06. Important Dates
| Event | Date / Time | Mode / Notes |
|---|---|---|

---

## 07. Commercial and Submission Requirements
| Requirement | Details |
|---|---|

---

## 08. Red Flags
[For each flag:]
**[Flag Title]** — Risk Level: [High/Medium/Low]
Clause/Condition: [exact text or reference]
Why it matters: [impact]
Recommended Action: [specific action]

---

## 09. Clarification Questions
| # | Question | Section | Why Critical |
|---|---|---|---|

---

*Generated by ProposalPilot BFSI | For internal use only | Facts extracted from uploaded RFP only*`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { rfpText } = await req.json() as { rfpText: string };

    if (!rfpText || rfpText.trim().length < 200) {
      return new Response(
        JSON.stringify({ error: "rfpText must be at least 200 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const truncatedText = rfpText.length > 28000
      ? rfpText.slice(0, 28000) + "\n\n[Document truncated at 28000 characters. Review remaining sections manually.]"
      : rfpText;

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 8000,
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyze this BFSI RFP. Extract all information accurately. Do not invent any eligibility criteria, evaluation scores, or facts not present in the document.\n\nRFP TEXT:\n\n${truncatedText}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const message = (errBody as { error?: { message?: string } }).error?.message ?? `OpenAI API error ${response.status}`;
      return new Response(
        JSON.stringify({ error: message }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const raw = (data.choices[0]?.message?.content ?? "").trim();

    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    const jsonStart = cleaned.indexOf("{");
    if (jsonStart === -1) {
      return new Response(
        JSON.stringify({ error: "No JSON found in API response", raw_preview: raw.slice(0, 500) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let depth = 0;
    let jsonEnd = -1;
    for (let i = jsonStart; i < cleaned.length; i++) {
      if (cleaned[i] === "{") depth++;
      else if (cleaned[i] === "}") {
        depth--;
        if (depth === 0) { jsonEnd = i; break; }
      }
    }

    if (jsonEnd === -1) {
      return new Response(
        JSON.stringify({ error: "Malformed JSON in API response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jsonStr = cleaned.slice(jsonStart, jsonEnd + 1);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonStr);
    } catch {
      return new Response(
        JSON.stringify({ error: "API returned invalid JSON", raw_preview: jsonStr.slice(0, 500) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unwrap structured_json if present, keeping all keys flat
    const pj = parsedJson as Record<string, unknown>;
    const sj = (pj.structured_json ?? pj) as Record<string, unknown>;
    let markdownStr = typeof sj.markdown_report === "string" ? sj.markdown_report : "";
    if (!markdownStr && typeof pj.markdown_report === "string") {
      markdownStr = pj.markdown_report;
    }
    if (!markdownStr) {
      // Fallback: any text after the JSON block
      markdownStr = cleaned.slice(jsonEnd + 1).replace(/^\s*PART\s*2[:\s]*/i, "").trim();
    }

    // Build flat json — spread all structured_json keys to top level with markdown_report included
    const flatJson: Record<string, unknown> = { ...sj, markdown_report: markdownStr };

    return new Response(
      JSON.stringify({ json: JSON.stringify(flatJson, null, 2), markdown: markdownStr }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
