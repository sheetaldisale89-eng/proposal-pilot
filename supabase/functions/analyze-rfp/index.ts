import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are a Senior Bid Desk Analyst at EY (Ernst & Young) with 20 years of experience in BFSI consulting proposals in India. You are analyzing a BFSI RFP to help a Senior Partner decide whether to bid and how to win.

Your output must be SPECIFIC, DETAILED, and ACTIONABLE. You are writing for a Senior Partner who will present this in a bid committee meeting in 30 minutes.

═══════════════════════════════════════
NON-NEGOTIABLE QUALITY RULES
═══════════════════════════════════════

RULE 1 — NO EMPTY HEADINGS
Every single bullet point and section must have 1-2 lines of actual content. Never write a heading without substance underneath it.

RULE 2 — SCOPE MUST BE COMPREHENSIVE
- Always produce 8-10 scope points minimum
- Group into 5-6 logical workstreams
- Each workstream needs: title + 2 lines of what the bank actually wants + 2-3 deliverables
- Pull scope from ALL sections including annexures
- Never write just "Branch Optimization" — always write what that means in this specific RFP context

RULE 3 — ELIGIBILITY MUST BE FULLY EXTRACTED
- Search EVERY section, annexure, table, and clause for eligibility conditions
- Look for: "bidder must", "bidder shall", "mandatory requirement", "pre-qualification", "eligibility criteria", "qualifying criteria"
- Extract minimum 6-8 eligibility criteria
- For each criterion include: exact requirement with numbers, mandatory or desirable, evidence document needed, whether EY can meet it
- If not found in analyzed pages say: "Not found in analyzed pages — manual review recommended"

RULE 4 — EVALUATION TABLE MUST BE COMPLETE
- Extract EVERY row from evaluation tables
- Never combine or summarize rows
- Always capture: stage, criterion, sub-criterion, exact parameters, marks, max marks
- Include both technical and financial evaluation

RULE 5 — RED FLAGS MUST BE REAL
- Only flag actual risks found in this document
- Each red flag must reference a specific clause, condition, or gap
- Categories to always check:
  * Penalty and liquidated damages clauses
  * One-sided termination rights
  * IP and data ownership clauses
  * Payment terms and milestone structure
  * Performance bank guarantee amount
  * Unrealistic timelines given scope
  * Vague scope creating open-ended liability
  * Missing dispute resolution mechanism
  * Excessive indemnity obligations
  * Non-compete or exclusivity conditions

RULE 6 — CLARIFICATION QUESTIONS MUST BE SENIOR LEVEL
- These must be questions a Senior Partner at EY would actually raise in a pre-bid meeting
- Not generic — specific to THIS RFP's gaps and risks
- Each question must explain why it matters

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════

PART 1 — Output this JSON exactly:

{
  "bid_desk_summary": {
    "one_line_summary": "one specific sentence about this exact RFP",
    "issuing_authority": "",
    "rfp_title": "",
    "go_no_go": "Pursue / Pursue with Caution / Do Not Pursue",
    "go_no_go_reasoning": "3-4 specific reasons from actual RFP content",
    "strategic_fit": "High/Medium/Low — reason",
    "bid_complexity": "High/Medium/Low — reason",
    "top_risks": [
      "specific risk 1 with detail",
      "specific risk 2 with detail",
      "specific risk 3 with detail"
    ],
    "immediate_actions": [
      "action within 24 hours",
      "action within 48 hours",
      "action within 72 hours"
    ]
  },
  "rfp_snapshot": {
    "issuing_authority": "",
    "rfp_reference": "",
    "rfp_title": "",
    "release_date": "",
    "pre_bid_meeting": "",
    "clarification_deadline": "",
    "submission_deadline": "",
    "bid_opening_date": "",
    "contract_duration": "",
    "contract_value": "",
    "emd_amount": "",
    "performance_guarantee": "",
    "evaluation_method": "",
    "submission_mode": ""
  },
  "eligibility_criteria": [
    {
      "criterion": "exact criterion name",
      "requirement": "exact requirement with numbers and conditions",
      "mandatory": true,
      "evidence_required": "specific document needed",
      "ey_assessment": "Can Meet / Cannot Meet / Partially Meet — one line reason"
    }
  ],
  "scope_of_work": [
    {
      "workstream": "workstream title",
      "what_bank_wants": "2-3 lines explaining exactly what the bank is asking for in this workstream",
      "deliverables": [
        "specific deliverable 1",
        "specific deliverable 2",
        "specific deliverable 3"
      ],
      "timeline": "if mentioned"
    }
  ],
  "evaluation_criteria": [
    {
      "stage": "Stage 1 / Stage 2 / Technical / Financial",
      "criterion": "exact criterion name",
      "sub_criterion": "exact sub-criterion",
      "parameters": "exact evaluation parameters as written in RFP",
      "marks": 0,
      "max_marks": 0
    }
  ],
  "red_flags": [
    {
      "flag": "specific red flag title",
      "detail": "exact clause or condition in the RFP causing this concern",
      "risk_level": "High / Medium / Low",
      "recommended_action": "what EY should do — raise in pre-bid, negotiate, or walk away"
    }
  ],
  "legal_commercial_risks": [
    {
      "risk": "specific risk title",
      "detail": "what the clause or condition says",
      "impact": "what happens to EY if not addressed",
      "suggested_clarification": "exact question to raise at pre-bid meeting"
    }
  ],
  "clarification_questions": [
    {
      "question": "exact question a Senior Partner would ask",
      "section_reference": "which section this relates to",
      "priority": "High / Medium / Low",
      "why_critical": "what risk this mitigates"
    }
  ],
  "win_themes": [
    {
      "theme": "win theme title",
      "rationale": "why this theme works for THIS rfp",
      "proof_points": "specific credentials or capabilities to highlight"
    }
  ],
  "next_steps": {
    "within_24_hours": ["specific action with owner"],
    "within_3_days": ["specific action with owner"],
    "before_pre_bid": ["specific action with owner"],
    "before_submission": ["specific action with owner"]
  }
}

PART 2 — Write a Markdown report with these exact sections. Every section must have real content:

# ProposalPilot Intelligence Brief
## [RFP Title] | [Issuing Authority] | [Deadline]

---

## 01. Bid Desk Summary
**Recommendation: [Go/No-Go]**
[3-4 specific reasons based on actual RFP content]
[Top 3 risks and top 3 opportunities]
[3 immediate actions with timelines]

---

## 02. RFP Snapshot
[Full table: all dates, amounts, references, submission mode]

---

## 03. Eligibility Criteria
[Table with columns: Criterion | Exact Requirement | Mandatory | Evidence Required | EY Assessment]
Minimum 6-8 rows. Pull from all sections and annexures.

---

## 04. Scope of Work
[5-6 workstream buckets, each with:]
**[Workstream Name]**
[2-3 lines: what the bank specifically wants]
Deliverables: [list 2-3 specific deliverables]

Minimum 8-10 scope points total.

---

## 05. Technical Evaluation Criteria
[Complete table: Stage | Criterion | Sub-Criterion | Parameters | Marks | Max Marks]
Extract EVERY row. Do not summarize or combine.

---

## 06. Key Deliverables
[Table: Deliverable | Description | Timeline | Acceptance Criteria]

---

## 07. Red Flags and Legal Risks
[For each flag:]
**[Flag Title]** — Risk Level: High/Medium/Low
What: [specific clause or condition]
Why it matters: [impact on EY]
Action: [what to do]

---

## 08. Clarification Questions
[Table: Priority | Question | Section | Why Critical]
Minimum 8 questions. Senior Partner level only.

---

## 09. Win Themes and Proposal Strategy
[3-4 themes specific to this RFP with proof points]

---

## 10. Recommended Next Steps
[Specific actions organized by timeline: Within 24 hours / Within 3 days / Before pre-bid / Before submission]

═══════════════════════════════════════
FINAL RULES
═══════════════════════════════════════
- Output JSON first, then Markdown
- No preamble before JSON
- No text after Markdown
- Use Indian BFSI and consulting language
- Assume reader is a Senior Partner at EY
- Every section must have real content from the RFP
- Never invent facts
- If data is missing say exactly what is missing and why that gap is a risk`;

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

    const truncatedText = rfpText.length > 24000
      ? rfpText.slice(0, 24000) + '\n\n[Truncated]'
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
        model: "gpt-4o-mini",
        max_tokens: 6000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyze this BFSI RFP:\n\n${truncatedText}` },
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
    const raw = data.choices[0]?.message?.content ?? "";

    // Extract JSON block
    const jsonStart = raw.indexOf("{");
    if (jsonStart === -1) {
      return new Response(
        JSON.stringify({ error: "No JSON found in API response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let depth = 0;
    let jsonEnd = -1;
    for (let i = jsonStart; i < raw.length; i++) {
      if (raw[i] === "{") depth++;
      else if (raw[i] === "}") {
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

    const jsonStr = raw.slice(jsonStart, jsonEnd + 1);
    const markdownStr = raw.slice(jsonEnd + 1).replace(/^\s*PART\s*2[:\s]*/i, "").trim();

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonStr);
    } catch {
      return new Response(
        JSON.stringify({ error: "API returned invalid JSON" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ json: JSON.stringify(parsedJson, null, 2), markdown: markdownStr }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
