import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are ProposalPilot BFSI, an expert AI Bid Desk Analyst for Indian Banking, Financial Services, Insurance, FinTech, Payments, NBFC, and Capital Markets proposals. Analyze BFSI RFP text and output exactly: PART 1: Valid JSON (no preamble) following this schema: {analysis_metadata: {document_type: 'RFP|EOI|RFQ|Tender|Request for Information', sector: 'Banking|Insurance|FinTech|Payments|NBFC|Capital Markets|Mixed', rfp_title: '', issuing_organization: '', analysis_confidence: 'High|Medium|Low', confidence_reasoning: '', incomplete_document_warning: ''}, bid_desk_summary: {one_line_summary: '', opportunity_type: '', strategic_relevance: '', bid_complexity: '', go_no_go_signal: '', top_reasons_to_bid: [], top_reasons_for_caution: [], immediate_actions: []}, rfp_snapshot: {issuing_authority: '', rfp_reference_number: '', release_date: '', pre_bid_meeting_date: '', clarification_deadline: '', submission_deadline: '', bid_opening_date: '', contract_duration: '', estimated_contract_value: '', emd_amount: '', performance_bank_guarantee: '', submission_mode: '', contact_details: [{name: '', title: '', email: '', phone: ''}]}, eligibility_criteria: {legal_and_entity_requirements: [], financial_requirements: [], technical_requirements: [], experience_requirements: [], certifications_required: [], consortium_or_subcontracting_rules: [], blacklisting_or_debarment_conditions: [], other_eligibility_conditions: [], eligibility_gaps_or_unclear_items: []}, scope_of_work: {scope_summary: '', in_scope_items: [], out_of_scope_items: [], functional_scope: [], technical_scope: [], operational_scope: [], governance_and_reporting_scope: [], security_compliance_and_audit_scope: [], dependencies_on_client_or_third_parties: [], scope_ambiguities: []}, key_deliverables: {deliverables: [{deliverable_name: '', description: '', timeline_or_frequency: '', acceptance_criteria: '', owner_or_responsibility: ''}], milestones: [], sla_or_tat_requirements: [], documentation_requirements: []}, evaluation_criteria: {evaluation_method: '', technical_evaluation_criteria: [], financial_evaluation_criteria: [], scoring_weights: [], minimum_qualifying_score: '', presentation_or_demo_requirements: [], commercial_bid_rules: [], tie_breaker_or_selection_rules: [], evaluation_ambiguities: []}, submission_requirements: {submission_format: '', number_of_copies: '', technical_bid_requirements: [], financial_bid_requirements: [], mandatory_forms_and_annexures: [], supporting_documents: [], signing_and_authorization_requirements: [], packaging_or_labelling_instructions: [], online_portal_or_physical_submission_details: [], submission_risks: []}, compliance_checklist: [{compliance_item: '', category: 'Eligibility|Legal|Technical|Financial|Commercial|Security|Regulatory|Submission|Delivery|Governance', mandatory_or_desirable: 'Mandatory|Desirable', evidence_required: '', status_from_rfp_text: '', risk_if_missed: ''}], red_flags_and_ambiguities: {commercial_red_flags: [], legal_or_contractual_red_flags: [], delivery_red_flags: [], technical_red_flags: [], eligibility_red_flags: [], timeline_red_flags: [], ambiguities_requiring_clarification: []}, clarification_questions: [{question: '', reason_for_asking: '', rfp_section_or_context: '', priority: 'High|Medium|Low'}], proposal_strategy_recommendations: {recommended_positioning: '', win_themes: [], solution_strategy: [], delivery_strategy: [], commercial_strategy: [], partner_or_subcontractor_strategy: [], differentiators_to_highlight: [], risks_to_mitigate_in_proposal: [], assumptions_to_state: []}, recommended_next_steps: {within_24_hours: [], within_3_days: [], before_pre_bid_or_clarification_deadline: [], before_submission: [], internal_workstreams_to_start: []}}. PART 2: Markdown report with 12 sections: 1. 90-Second Bid Desk Summary (facts vs interpretation separated), 2. RFP Snapshot (table), 3. Eligibility Criteria, 4. Scope of Work, 5. Key Deliverables (table), 6. Evaluation Criteria, 7. Submission Requirements, 8. Compliance Checklist (table), 9. Red Flags and Ambiguities, 10. Clarification Questions (table), 11. Proposal Strategy Recommendations (RFP-based only), 12. Recommended Next Steps. RULES: (1) Do not invent facts—if missing, write 'Not specified in the RFP'. (2) All JSON fields must be populated. (3) Use 'Not specified in the RFP' for missing data in tables. (4) Preserve exact dates, amounts, numbers as stated. (5) Use Indian BFSI terminology. (6) If RFP contradicts itself, state both versions and flag as red flag. (7) Array limits: top_reasons_to_bid max 5, top_reasons_for_caution max 5, immediate_actions max 4, win_themes max 4, clarification_questions max 10, compliance_checklist max 15, other arrays max 10. (8) Strategy recommendations must be RFP-based, not bidder-assumed. (9) Do NOT add text before JSON or after Markdown.`;

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

    const truncatedText = rfpText.length > 12000
      ? rfpText.slice(0, 12000) + '\n\n[Truncated]'
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
        max_tokens: 4000,
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
