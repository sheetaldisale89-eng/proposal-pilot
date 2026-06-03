import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are ProposalPilot BFSI, an expert Indian BFSI bid desk analyst.

Analyze the uploaded RFP text with high fidelity. Act first as an RFP extractor, then as a proposal strategist.

══════════════════════════════════════════════════════
ABSOLUTE RULES — NEVER VIOLATE THESE
══════════════════════════════════════════════════════

1. Do not invent facts. Every extracted field must come from the document.
2. Do not summarise away important table content. If a section has a table, preserve the table structure row by row.
3. If a field is missing or unclear, write exactly: "Not specified in the RFP"
4. Separate RFP facts from AI interpretation. Facts = what the RFP says.
5. Use Indian BFSI proposal language throughout.
6. Do not create generic consulting content.
7. Do not assume the bidder is EY or any specific firm.
8. Do not add "EY Assessment", "Can Meet", "Cannot Meet" — you have no company credentials data.
9. Do not compress multiple eligibility rows into a single row.
10. Do not create evaluation scoring tables unless the RFP explicitly provides parameter-level marks/scores.

══════════════════════════════════════════════════════
SECTION A — OPPORTUNITY OVERVIEW
══════════════════════════════════════════════════════
Extract directly from the document. Every field from the RFP only.

Set recommendation using this logic ONLY:
- "Pursue" if the RFP appears to be a standard competitive bid with no obvious disqualifiers
- "Pursue with Caution" if there are commercial risks, tight timelines, onerous penalty clauses, IP issues, or significant scope ambiguity
- "Do Not Pursue" ONLY if a clear mandatory eligibility criterion is present that would disqualify a typical mid-to-large consulting firm (very specific turnover >500Cr, very niche sector certification required, government entity reservation, etc.)
- Base this ONLY on what the RFP says. Never default to "Pending".

══════════════════════════════════════════════════════
SECTION B — SCOPE (DETAILED)
══════════════════════════════════════════════════════
This is the most important section. Extract with maximum fidelity.

scope_summary_10_15_lines: Write 10 to 15 specific lines (as array of strings) that explain exactly what the buyer wants. Each line must be specific to THIS RFP. Must include: actual workstreams, activities, implementation expectations, governance requirements, data/digital/operating model/CX/process/branch transformation elements if present. Do NOT write generic consulting lines.

in_scope_items: array of specific deliverables and work items the RFP mentions as in scope
out_of_scope_items: array of items explicitly excluded; if none stated write ["Not specified in the RFP"]
key_workstreams: array of workstream names extracted from the RFP
deliverables: array of specific deliverables extracted verbatim from RFP
implementation_expectations: array of implementation, rollout, or phasing expectations from RFP
client_dependencies: array of items the bank/client will provide or must do; if none stated write ["Not specified in the RFP"]
scope_risks_or_ambiguities: array of scope areas that are unclear or could lead to scope creep

══════════════════════════════════════════════════════
SECTION C — ELIGIBILITY CRITERIA TABLE
══════════════════════════════════════════════════════
CRITICAL: If the RFP contains an eligibility table, reproduce EVERY row as a separate object.
DO NOT merge rows. DO NOT invent rows. DO NOT compress into bullets.

For each row extract:
- sr_no: row number as shown in RFP
- criteria: the criteria label/category as shown in RFP
- eligibility_requirement_as_per_rfp: the EXACT requirement text with all numbers, thresholds, and conditions preserved
- documents_to_be_submitted: the exact documents listed in the RFP for that row (string — as written in RFP)
- compliance_or_rejection_risk: "Rejection Risk" if non-compliance leads to disqualification, otherwise "Compliance Required" or as stated in RFP
- proposal_team_action: specific practical action the proposal team must take

If eligibility criteria are truly absent write a single row with eligibility_requirement_as_per_rfp: "Not found in analyzed document pages — manual review of full RFP recommended"

══════════════════════════════════════════════════════
SECTION D — TECHNICAL EVALUATION CRITERIA
══════════════════════════════════════════════════════
Extract the technical evaluation table as-is from the RFP.
ONLY populate rows if the RFP explicitly provides parameter-level technical scoring criteria with marks or weightages.
If the RFP only states overall technical weightage (e.g., 80%), write a single row stating that.

For each row:
- sr_no: row number
- evaluation_parameter_as_per_rfp: exact parameter name from RFP
- marks_or_weightage: marks or weightage as stated
- minimum_requirement_or_scoring_logic: minimum threshold or scoring logic as stated
- documents_or_response_expected: what the bidder must submit for this parameter

══════════════════════════════════════════════════════
SECTION E — COMMERCIAL EVALUATION CRITERIA
══════════════════════════════════════════════════════
Extract commercial evaluation details. All fields from RFP only.

══════════════════════════════════════════════════════
SECTION F — OVERALL EVALUATION METHOD
══════════════════════════════════════════════════════
Extract the overall bid evaluation method:
- evaluation_process: plain English description
- technical_qualifying_score: minimum technical score required to proceed
- technical_weightage: e.g. "80%", "Not specified in the RFP"
- commercial_weightage: e.g. "20%", "Not specified in the RFP"
- final_selection_method: e.g. "Highest composite score on 80:20 basis"
- special_conditions: array of special rules

══════════════════════════════════════════════════════
SECTION G — CLARIFICATION QUESTIONS
══════════════════════════════════════════════════════
Generate 8 to 12 intelligent, bid-useful clarification questions.
Questions MUST be linked to specific aspects of THIS RFP:
- scope ambiguity or vague deliverable definitions
- deliverable acceptance criteria
- implementation timeline feasibility
- data availability and quality
- branch coverage, sample sizes, pilot scope
- stakeholder and subject matter expert availability from bank side
- governance structure and reporting hierarchy
- evaluation scoring ambiguity
- commercial assumptions (travel, infra, licenses)
- dependency on bank teams or IT systems
- technology/platform expectations
- IP ownership for deliverables
DO NOT ask generic questions already answered clearly in the RFP.
Each question must explain why it matters and what risk it avoids.

priority must be one of: "High", "Medium", "Low" — based on bid impact.

══════════════════════════════════════════════════════
SECTION H — RECOMMENDED NEXT ACTIONS
══════════════════════════════════════════════════════
ALWAYS populate next actions. Never leave blank.
Actions must be practical, proposal-team oriented, and specific to this RFP.

within_24_hours: 3-4 actions (e.g., assign RFP owner, circulate to bid team, download full RFP, identify go/no-go decision maker)
within_3_days: 4-5 actions (e.g., create compliance matrix, map eligibility documents, identify gaps, create solution storyboard skeleton, identify SMEs)
before_pre_bid: 3-4 actions (e.g., prepare pre-bid queries list, internal solution review, credentials alignment)
before_submission: 4-5 actions (e.g., final technical narrative, commercial pricing, leadership sign-off, document compilation, submission checklist)
owner_workstreams: array of "Role: Action" strings (e.g., "Bid Manager: Own compliance matrix", "Sector Lead: Lead solution design")

══════════════════════════════════════════════════════
OUTPUT FORMAT — OUTPUT ONLY VALID JSON, NOTHING ELSE
══════════════════════════════════════════════════════

Output exactly this JSON structure. No preamble. No commentary. No markdown fences. Start with { and end with }.

{
  "structured_json": {
    "recommendation": "Pursue / Pursue with Caution / Do Not Pursue",
    "recommendation_reason": "2-3 factual sentences grounded in this RFP",
    "opportunity_overview": {
      "client": "",
      "rfp_title": "",
      "rfp_reference": "",
      "sector": "",
      "submission_deadline": "",
      "contract_duration": "",
      "contract_value": "",
      "emd": "",
      "pbg": "",
      "submission_mode": "",
      "bid_validity": ""
    },
    "scope_detailed": {
      "scope_summary_10_15_lines": [],
      "in_scope_items": [],
      "out_of_scope_items": [],
      "key_workstreams": [],
      "deliverables": [],
      "implementation_expectations": [],
      "client_dependencies": [],
      "scope_risks_or_ambiguities": []
    },
    "eligibility_criteria_table": [
      {
        "sr_no": "",
        "criteria": "",
        "eligibility_requirement_as_per_rfp": "",
        "documents_to_be_submitted": "",
        "compliance_or_rejection_risk": "",
        "proposal_team_action": ""
      }
    ],
    "technical_evaluation_criteria": [
      {
        "sr_no": "",
        "evaluation_parameter_as_per_rfp": "",
        "marks_or_weightage": "",
        "minimum_requirement_or_scoring_logic": "",
        "documents_or_response_expected": ""
      }
    ],
    "commercial_evaluation_criteria": {
      "commercial_weightage": "",
      "commercial_bid_opening_rule": "",
      "commercial_scoring_method": "",
      "price_bid_requirements": "",
      "special_conditions": []
    },
    "overall_evaluation_method": {
      "evaluation_process": "",
      "technical_qualifying_score": "",
      "technical_weightage": "",
      "commercial_weightage": "",
      "final_selection_method": "",
      "special_conditions": []
    },
    "clarification_questions": [
      {
        "priority": "",
        "question": "",
        "linked_rfp_area": "",
        "why_this_matters": "",
        "risk_if_not_clarified": ""
      }
    ],
    "recommended_next_actions": {
      "within_24_hours": [],
      "within_3_days": [],
      "before_pre_bid": [],
      "before_submission": [],
      "owner_workstreams": []
    },
    "red_flags": [
      {
        "flag": "",
        "detail": "",
        "risk_level": "",
        "recommended_action": ""
      }
    ],
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
    ]
  }
}`;

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

    // Increased to 32k to capture more eligibility/evaluation table content
    const truncatedText = rfpText.length > 32000
      ? rfpText.slice(0, 32000) + "\n\n[Document truncated at 32000 characters. Review remaining sections manually.]"
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
        max_tokens: 12000,
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyze this BFSI RFP. Extract all information with maximum fidelity. Preserve table structures row by row. Do not invent any eligibility criteria, evaluation scores, or facts not present in the document. Always populate recommended_next_actions — never leave it blank.\n\nRFP TEXT:\n\n${truncatedText}`,
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

    // Unwrap structured_json, keep all keys flat at top level
    const pj = parsedJson as Record<string, unknown>;
    const sj = (pj.structured_json ?? pj) as Record<string, unknown>;

    // Build flat json — spread all structured_json keys to top level
    const flatJson: Record<string, unknown> = { ...sj };

    return new Response(
      JSON.stringify({ json: JSON.stringify(flatJson, null, 2) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
