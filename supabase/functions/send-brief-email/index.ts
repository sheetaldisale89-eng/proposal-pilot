import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function s(val: unknown, fallback = "Not specified in the RFP"): string {
  if (val === null || val === undefined || val === "") return fallback;
  return String(val);
}

function arr<T>(val: unknown): T[] {
  return Array.isArray(val) ? (val as T[]) : [];
}

function obj(val: unknown): Record<string, unknown> {
  if (val && typeof val === "object" && !Array.isArray(val)) return val as Record<string, unknown>;
  return {};
}

function esc(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function senderName(email: string): string {
  const local = (email || "").split("@")[0] || "";
  const first = local.split(".")[0] || local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

// ── Resolve recommendation — single source of truth ───────────────────────

function resolveRecommendation(full: Record<string, unknown>): string {
  // New schema: recommendation at root
  if (full.recommendation) return s(full.recommendation);
  // New schema: opportunity_overview.recommendation
  const ov = obj(full.opportunity_overview);
  if (ov.recommendation) return s(ov.recommendation);
  // Legacy: bid_desk_summary
  const bd = obj(full.bid_desk_summary);
  if (bd.go_no_go || bd.go_no_go_signal) return s(bd.go_no_go || bd.go_no_go_signal);
  return "Pending Review";
}

function resolveRecommendationReason(full: Record<string, unknown>): string {
  if (full.recommendation_reason) return s(full.recommendation_reason);
  const ov = obj(full.opportunity_overview);
  if (ov.one_line_reason) return s(ov.one_line_reason);
  const bd = obj(full.bid_desk_summary);
  return s(bd.go_no_go_reasoning || bd.one_line_summary, "");
}

// ── Section helpers ───────────────────────────────────────────────────────────

function sectionHeader(num: string, title: string): string {
  return `<h2 style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#0f1b2e;
    border-bottom:2px solid #e5e5e5;padding-bottom:6px;margin:28px 0 12px 0;">
    <span style="color:#888;font-size:12px;margin-right:8px;">${num}</span>${esc(title)}</h2>`;
}

function tableStyle(): string {
  return `width:100%;border-collapse:collapse;font-size:13px;`;
}

function th(label: string): string {
  return `<th style="border:1px solid #ddd;padding:8px 10px;text-align:left;
    background:#f0f3f7;color:#0f1b2e;font-weight:bold;font-size:12px;">${esc(label)}</th>`;
}

function td(content: string, extra = ""): string {
  return `<td style="border:1px solid #ddd;padding:7px 10px;color:#1a1a1a;
    vertical-align:top;font-size:13px;${extra}">${content}</td>`;
}

function goBadge(rec: string): string {
  const v = rec.toLowerCase();
  if (v.includes("caution"))
    return `<span style="display:inline-block;padding:4px 14px;border-radius:12px;
      background:#fff3cd;color:#856404;font-weight:bold;font-size:13px;border:1px solid #ffc107;">${esc(rec)}</span>`;
  if (v === "pursue")
    return `<span style="display:inline-block;padding:4px 14px;border-radius:12px;
      background:#d4f8e8;color:#1a7a4a;font-weight:bold;font-size:13px;border:1px solid #28a745;">${esc(rec)}</span>`;
  if (v.includes("do not") || v.includes("no go") || v.includes("no-go"))
    return `<span style="display:inline-block;padding:4px 14px;border-radius:12px;
      background:#fde8e8;color:#cc0000;font-weight:bold;font-size:13px;border:1px solid #dc3545;">${esc(rec)}</span>`;
  return `<span style="display:inline-block;padding:4px 14px;border-radius:12px;
    background:#f0f0f0;color:#555;font-weight:bold;font-size:13px;">${esc(rec)}</span>`;
}

// ── Section builders ─────────────────────────────────────────────────────────

function buildOpportunityOverview(full: Record<string, unknown>, projectTitle: string): string {
  const ov = obj(full.opportunity_overview);
  const rec = resolveRecommendation(full);
  const reason = resolveRecommendationReason(full);

  const client = s(ov.client, projectTitle);
  const rfpTitle = s(ov.rfp_title, projectTitle);
  const deadline = s(ov.submission_deadline, "");
  const duration = s(ov.contract_duration, "");
  const value = s(ov.contract_value, "");
  const emd = s(ov.emd, "");
  const pbg = s(ov.pbg, "");

  const rows: Array<[string, string, string]> = [
    ["Client / Issuing Authority", esc(client), ""],
    ["RFP Title", esc(rfpTitle), ""],
    ["Submission Deadline", `<strong style="color:#cc0000;">${esc(deadline || "Not specified")}</strong>`, ""],
    ["Contract Duration", esc(duration || "Not specified"), ""],
    ["Contract / Project Value", esc(value || "Not specified"), ""],
    ["EMD", esc(emd || "Not specified"), ""],
    ["Performance Bank Guarantee", esc(pbg || "Not specified"), ""],
    ["Recommendation", rec ? goBadge(rec) : esc("Pending Review"), ""],
  ];
  if (reason) rows.push(["Reason", `<em style="color:#555;">${esc(reason)}</em>`, ""]);

  const tableRows = rows.map(([label, value]) => `
    <tr>
      <td style="border:none;padding:5px 0;width:38%;color:#555;font-size:13px;vertical-align:top;">${label}</td>
      <td style="border:none;padding:5px 0;color:#1a1a1a;font-size:13px;">${value}</td>
    </tr>`).join("");

  return `${sectionHeader("01", "Opportunity Overview")}
    <table style="${tableStyle()}">${tableRows}</table>`;
}

function buildScopeSnapshot(full: Record<string, unknown>): string {
  // New schema: scope_detailed.scope_summary_10_15_lines
  const scopeDetailed = obj(full.scope_detailed);
  const lines = arr<string>(scopeDetailed.scope_summary_10_15_lines);

  // Fallback to legacy scope_snapshot or scope_of_work
  const fallbackBullets = lines.length > 0 ? lines
    : arr<unknown>(full.scope_snapshot).map(b => s(b));

  const display = fallbackBullets.slice(0, 12);
  if (!display.length) return "";

  const items = display.map(b =>
    `<li style="font-size:13px;color:#1a1a1a;line-height:1.7;margin-bottom:4px;">${esc(s(b))}</li>`
  ).join("");

  // Key deliverables
  const deliverables = arr<string>(scopeDetailed.deliverables).slice(0, 10);
  const delivHtml = deliverables.length > 0
    ? `<p style="font-size:12px;font-weight:bold;color:#0f1b2e;margin:12px 0 4px;">Key Deliverables:</p>
       <ul style="margin:0;padding-left:20px;">
         ${deliverables.map(d => `<li style="font-size:13px;color:#1a1a1a;line-height:1.6;margin-bottom:3px;">${esc(d)}</li>`).join("")}
       </ul>`
    : "";

  return `${sectionHeader("02", "Scope Snapshot")}
    <ul style="margin:6px 0 0;padding-left:20px;">${items}</ul>
    ${delivHtml}`;
}

function buildEligibilityTable(full: Record<string, unknown>): string {
  const rows = arr<Record<string, unknown>>(full.eligibility_criteria_table);
  const MAX_EMAIL_ROWS = 10;
  const display = rows.slice(0, MAX_EMAIL_ROWS);

  if (!rows.length) {
    return `${sectionHeader("03", "Eligibility Criteria")}
      <p style="font-size:13px;color:#666;">Not found in analyzed document pages — manual review recommended.</p>`;
  }

  const headerRow = `<tr>${[
    "#", "Criteria", "Eligibility Requirement (as per RFP)", "Documents to be Submitted", "Proposal Team Action"
  ].map(th).join("")}</tr>`;

  const bodyRows = display.map((row, i) => {
    const bg = i % 2 === 0 ? "#ffffff" : "#fafafa";
    // New schema uses criteria + eligibility_requirement_as_per_rfp
    const criteria = s(row.criteria || row.criteria_category, "—");
    const req = s(row.eligibility_requirement_as_per_rfp || row.eligibility_requirement, "—");
    const docs = s(row.documents_to_be_submitted, "—");
    const action = s(row.proposal_team_action, "—");
    const risk = s(row.compliance_or_rejection_risk, "");
    const riskColor = risk.toLowerCase().includes("rejection") ? "color:#cc0000;font-size:11px;" : "color:#555;font-size:11px;";
    const riskBadge = risk ? `<br><span style="${riskColor}">[${esc(risk)}]</span>` : "";

    return `<tr style="background:${bg};">
      ${td(esc(s(row.sr_no, String(i + 1))))}
      ${td(`${esc(criteria)}${riskBadge}`)}
      ${td(esc(req))}
      ${td(esc(docs))}
      ${td(esc(action))}
    </tr>`;
  }).join("");

  const overflow = rows.length > MAX_EMAIL_ROWS
    ? `<p style="font-size:12px;color:#555;margin:6px 0 0;font-style:italic;">${rows.length - MAX_EMAIL_ROWS} additional row(s) in full report.</p>`
    : "";

  return `${sectionHeader("03", "Eligibility Criteria")}
    <table style="${tableStyle()}">${headerRow}<tbody>${bodyRows}</tbody></table>${overflow}`;
}

function buildEvaluationSection(full: Record<string, unknown>): string {
  const overall = obj(full.overall_evaluation_method);
  const techRows = arr<Record<string, unknown>>(full.technical_evaluation_criteria);
  const commercial = obj(full.commercial_evaluation_criteria);

  // Overall method summary
  const overallRows: Array<[string, string]> = [
    ["Evaluation Process", s(overall.evaluation_process)],
    ["Technical Weightage", s(overall.technical_weightage)],
    ["Commercial Weightage", s(overall.commercial_weightage)],
    ["Min. Technical Qualifying Score", s(overall.technical_qualifying_score || overall.minimum_technical_qualifying_score)],
    ["Final Selection Method", s(overall.final_selection_method)],
  ].filter(([, v]) => v && v !== "Not specified in the RFP");

  // Commercial summary
  const commRows: Array<[string, string]> = [
    ["Commercial Bid Opening Rule", s(commercial.commercial_bid_opening_rule)],
    ["Commercial Scoring Method", s(commercial.commercial_scoring_method)],
    ["Price Bid Requirements", s(commercial.price_bid_requirements)],
  ].filter(([, v]) => v && v !== "Not specified in the RFP");

  const overallTableHtml = overallRows.length > 0
    ? overallRows.map(([label, value], i) => {
        const bg = i % 2 === 0 ? "#ffffff" : "#fafafa";
        const isWeightage = label.toLowerCase().includes("weightage");
        const valStyle = isWeightage ? "font-weight:bold;color:#0f1b2e;" : "";
        return `<tr style="background:${bg};">
          ${td(`<strong>${esc(label)}</strong>`, "width:38%;")}
          ${td(`<span style="${valStyle}">${esc(value)}</span>`)}
        </tr>`;
      }).join("")
    : `<tr>${td("Not specified in the RFP", "color:#666;")}</tr>`;

  // Technical evaluation rows table (if present)
  const techTableHtml = techRows.length > 0
    ? `<p style="font-size:12px;font-weight:bold;color:#0f1b2e;margin:14px 0 6px;">Technical Evaluation Parameters:</p>
       <table style="${tableStyle()}">
         <tr>${["#", "Parameter (as per RFP)", "Marks / Weightage", "Min. Requirement / Scoring Logic", "Documents / Response Expected"].map(th).join("")}</tr>
         <tbody>
           ${techRows.map((row, i) => {
             const bg = i % 2 === 0 ? "#ffffff" : "#fafafa";
             return `<tr style="background:${bg};">
               ${td(esc(s(row.sr_no, String(i + 1))))}
               ${td(esc(s(row.evaluation_parameter_as_per_rfp)))}
               ${td(`<strong>${esc(s(row.marks_or_weightage))}</strong>`)}
               ${td(esc(s(row.minimum_requirement_or_scoring_logic, "—")))}
               ${td(esc(s(row.documents_or_response_expected, "—")))}
             </tr>`;
           }).join("")}
         </tbody>
       </table>`
    : "";

  const commTableHtml = commRows.length > 0
    ? `<p style="font-size:12px;font-weight:bold;color:#0f1b2e;margin:14px 0 6px;">Commercial Evaluation:</p>
       <table style="${tableStyle()}">
         <tbody>
           ${commRows.map(([label, value], i) => {
             const bg = i % 2 === 0 ? "#ffffff" : "#fafafa";
             return `<tr style="background:${bg};">
               ${td(`<strong>${esc(label)}</strong>`, "width:38%;")}
               ${td(esc(value))}
             </tr>`;
           }).join("")}
         </tbody>
       </table>`
    : "";

  return `${sectionHeader("04", "Evaluation Criteria")}
    <table style="${tableStyle()}"><tbody>${overallTableHtml}</tbody></table>
    ${techTableHtml}
    ${commTableHtml}`;
}

function buildClarificationQuestions(full: Record<string, unknown>): string {
  const questions = arr<Record<string, unknown>>(full.clarification_questions);
  const display = questions.slice(0, 5);
  if (!display.length) return "";

  const headerRow = `<tr>${["#", "Priority", "Question", "Linked RFP Area", "Why It Matters"].map(th).join("")}</tr>`;

  const bodyRows = display.map((q, i) => {
    const bg = i % 2 === 0 ? "#ffffff" : "#fafafa";
    const priority = s(q.priority, "Medium");
    const pColor = priority === "High" ? "color:#cc0000;font-weight:bold;" : priority === "Medium" ? "color:#cc6600;font-weight:bold;" : "color:#555;";
    const question = s(q.question);
    const area = s(q.linked_rfp_area || q.section_reference, "—");
    const why = s(q.why_this_matters || q.why_critical, "—");
    return `<tr style="background:${bg};">
      ${td(String(i + 1))}
      ${td(`<span style="${pColor}">${esc(priority)}</span>`)}
      ${td(esc(question))}
      ${td(esc(area))}
      ${td(`<em style="color:#555;">${esc(why)}</em>`)}
    </tr>`;
  }).join("");

  const overflow = questions.length > 5
    ? `<p style="font-size:12px;color:#555;margin:6px 0 0;font-style:italic;">${questions.length - 5} additional question(s) in full report.</p>`
    : "";

  return `${sectionHeader("05", "Intelligent Clarification Questions")}
    <table style="${tableStyle()}">${headerRow}<tbody>${bodyRows}</tbody></table>${overflow}`;
}

function buildNextActions(full: Record<string, unknown>): string {
  // New schema: recommended_next_actions
  const nextActions = obj(full.recommended_next_actions);
  const within24h = arr<string>(nextActions.within_24_hours);
  const within3d = arr<string>(nextActions.within_3_days);
  const preBid = arr<string>(nextActions.before_pre_bid);
  const preSubmission = arr<string>(nextActions.before_submission);

  const allEmpty = !within24h.length && !within3d.length && !preBid.length && !preSubmission.length;
  if (allEmpty) return "";

  const cols = [
    { label: "Within 24 Hours", items: within24h, color: "#cc0000" },
    { label: "Within 3 Days", items: within3d, color: "#cc6600" },
    { label: "Before Pre-Bid", items: preBid, color: "#0066cc" },
    { label: "Before Submission", items: preSubmission, color: "#1a7a4a" },
  ].filter(c => c.items.length > 0);

  const colHtml = cols.map(col => `
    <td style="vertical-align:top;padding:0 8px 0 0;width:${Math.floor(100 / cols.length)}%;">
      <p style="font-size:12px;font-weight:bold;color:${col.color};margin:0 0 6px;">${esc(col.label)}</p>
      <ul style="margin:0;padding-left:16px;">
        ${col.items.map(item => `<li style="font-size:12px;color:#1a1a1a;line-height:1.6;margin-bottom:4px;">${esc(item)}</li>`).join("")}
      </ul>
    </td>`).join("");

  return `${sectionHeader("06", "Recommended Next Actions")}
    <table style="width:100%;border-collapse:collapse;"><tr>${colHtml}</tr></table>`;
}

function buildRedFlags(full: Record<string, unknown>): string {
  const flags = arr<Record<string, unknown>>(full.red_flags);
  const display = flags.slice(0, 5);
  if (!display.length) return "";

  const items = display.map(f => {
    const level = s(f.risk_level, "").toLowerCase();
    const titleColor = level === "high" ? "#cc0000" : level === "medium" ? "#cc6600" : "#1a1a1a";
    return `<li style="font-size:13px;line-height:1.6;margin-bottom:12px;">
      <strong style="color:${titleColor};">${esc(s(f.flag))} [${esc(s(f.risk_level))}]</strong><br>
      ${esc(s(f.detail))}<br>
      <em style="color:#555;font-size:12px;">Action: ${esc(s(f.recommended_action))}</em>
    </li>`;
  }).join("");

  const overflow = flags.length > 5
    ? `<p style="font-size:12px;color:#555;margin:4px 0 0;font-style:italic;">${flags.length - 5} additional flag(s) in full report.</p>`
    : "";

  return `${sectionHeader("07", "Red Flags")}
    <ol style="margin:6px 0 0;padding-left:20px;">${items}</ol>${overflow}`;
}

// ── Main email builder ────────────────────────────────────────────────────────

function buildEmailHtml(
  analysis: Record<string, unknown>,
  projectTitle: string,
  userEmail: string
): string {
  const rawFull = analysis.full_analysis_json;
  const full = obj(rawFull);
  const name = senderName(userEmail);
  const ov = obj(full.opportunity_overview);
  const rfpTitle = s(ov.rfp_title, projectTitle);
  const client = s(ov.client, "");
  const rec = resolveRecommendation(full);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>RFP Intelligence Brief — ${esc(rfpTitle)}</title>
</head>
<body style="margin:0;padding:20px;background:#f4f4f4;font-family:Arial,sans-serif;">
  <div style="max-width:720px;margin:0 auto;background:#ffffff;">

    <!-- Top accent bar -->
    <div style="height:6px;background:#0f1b2e;"></div>

    <!-- Header -->
    <div style="padding:20px 28px 16px;border-bottom:1px solid #e5e5e5;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:18px;font-weight:bold;color:#0f1b2e;">ProposalPilot BFSI</div>
        <div style="font-size:12px;color:#888;margin-top:3px;">Intelligence Brief &mdash; Confidential &mdash; For Internal Use Only</div>
      </div>
      ${rec && rec !== "Pending Review" ? `<div>${goBadge(rec)}</div>` : ""}
    </div>

    <!-- Body -->
    <div style="padding:24px 28px 32px;">

      <p style="font-size:14px;color:#1a1a1a;margin:0 0 4px;line-height:1.6;">Dear ${esc(name)},</p>
      <p style="font-size:14px;color:#1a1a1a;margin:0 0 16px;line-height:1.6;">
        Please find below the RFP intelligence brief for <strong>${esc(client || rfpTitle)}</strong>. PFB the synopsis.
      </p>
      <hr style="border:none;border-top:1px solid #ddd;margin:0 0 4px;">

      ${buildOpportunityOverview(full, projectTitle)}
      ${buildScopeSnapshot(full)}
      ${buildEligibilityTable(full)}
      ${buildEvaluationSection(full)}
      ${buildClarificationQuestions(full)}
      ${buildNextActions(full)}
      ${buildRedFlags(full)}

      <!-- Sign-off -->
      <hr style="border:none;border-top:1px solid #ddd;margin:28px 0 16px;">
      <p style="font-size:14px;color:#1a1a1a;margin:0 0 4px;">Best Regards,</p>
      <p style="font-size:14px;color:#1a1a1a;margin:0 0 2px;">${esc(name)}</p>
      <p style="font-size:12px;color:#888;margin:0 0 2px;">Prepared using ProposalPilot BFSI</p>
      <p style="font-size:12px;color:#bbb;margin:0;">Confidential &nbsp;&middot;&nbsp; For internal use only</p>

    </div>

    <!-- Bottom accent bar -->
    <div style="height:3px;background:#0f1b2e;"></div>
  </div>
</body>
</html>`;
}

// ── Edge function entry point ─────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { to, projectId, userEmail } = await req.json() as {
      to: string[];
      projectId: string;
      userEmail: string;
    };

    if (!to || to.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients specified." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!projectId) {
      return new Response(JSON.stringify({ error: "projectId is required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: analysis, error: fetchErr } = await client
      .from("ai_analysis_results")
      .select("*, rfp_projects(title)")
      .eq("project_id", projectId)
      .maybeSingle();

    if (fetchErr || !analysis) {
      return new Response(JSON.stringify({ error: fetchErr?.message || "Analysis not found." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectTitle = s((analysis.rfp_projects as Record<string, unknown>)?.title, "RFP Intelligence Brief");
    const full = obj(analysis.full_analysis_json);
    const ov = obj(full.opportunity_overview);
    const rfpTitle = s(ov.rfp_title, projectTitle);
    const client_ = s(ov.client, "");
    const rec = resolveRecommendation(full);

    console.log("[EMAIL BUILD] recommendation:", rec, "eligibility rows:", arr(full.eligibility_criteria_table).length, "tech eval rows:", arr(full.technical_evaluation_criteria).length);

    const subject = client_
      ? `${client_} — ${rfpTitle} | RFP Intelligence Brief | ProposalPilot BFSI`
      : `${rfpTitle} | RFP Intelligence Brief | ProposalPilot BFSI`;

    const emailHtml = buildEmailHtml(analysis as Record<string, unknown>, projectTitle, userEmail || "");

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ProposalPilot BFSI <onboarding@resend.dev>",
        to,
        subject,
        html: emailHtml,
      }),
    });

    const resendResult = await resendRes.json();
    console.log("Resend result:", JSON.stringify(resendResult));

    if (!resendRes.ok) {
      throw new Error(`Resend failed: ${JSON.stringify(resendResult)}`);
    }

    return new Response(
      JSON.stringify({ success: true, sent_to: to, resend_id: resendResult.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
