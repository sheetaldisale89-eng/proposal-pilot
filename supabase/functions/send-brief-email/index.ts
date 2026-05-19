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

// ── Section helpers ───────────────────────────────────────────────────────────

function sectionHeader(title: string): string {
  return `<h2 style="font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:#0f1b2e;
    text-decoration:underline;margin:28px 0 10px 0;">${esc(title)}</h2>`;
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
    return `<span style="display:inline-block;padding:3px 12px;border-radius:10px;
      background:#fff3cd;color:#856404;font-weight:bold;font-size:13px;">${esc(rec)}</span>`;
  if (v === "pursue")
    return `<span style="display:inline-block;padding:3px 12px;border-radius:10px;
      background:#d4f8e8;color:#1a7a4a;font-weight:bold;font-size:13px;">${esc(rec)}</span>`;
  return `<span style="display:inline-block;padding:3px 12px;border-radius:10px;
    background:#fde8e8;color:#cc0000;font-weight:bold;font-size:13px;">${esc(rec)}</span>`;
}

// ── Section builders ─────────────────────────────────────────────────────────

function buildOpportunityOverview(ov: Record<string, unknown>): string {
  const rec = s(ov.recommendation, "");
  return `
    ${sectionHeader("1. Opportunity Overview")}
    <table style="${tableStyle()}">
      <tr><td style="border:none;padding:4px 0;width:38%;color:#555;font-size:13px;">Client</td>
          <td style="border:none;padding:4px 0;color:#1a1a1a;font-weight:bold;font-size:13px;">${esc(s(ov.client))}</td></tr>
      <tr><td style="border:none;padding:4px 0;color:#555;font-size:13px;">RFP Title</td>
          <td style="border:none;padding:4px 0;color:#1a1a1a;font-size:13px;">${esc(s(ov.rfp_title))}</td></tr>
      <tr><td style="border:none;padding:4px 0;color:#555;font-size:13px;">Submission Deadline</td>
          <td style="border:none;padding:4px 0;color:#cc0000;font-weight:bold;font-size:13px;">${esc(s(ov.submission_deadline))}</td></tr>
      <tr><td style="border:none;padding:4px 0;color:#555;font-size:13px;">Recommendation</td>
          <td style="border:none;padding:4px 0;">${rec ? goBadge(rec) : esc(s(ov.recommendation))}</td></tr>
      <tr><td style="border:none;padding:4px 0;color:#555;font-size:13px;vertical-align:top;">Reason</td>
          <td style="border:none;padding:4px 0;color:#1a1a1a;font-size:13px;">${esc(s(ov.one_line_reason))}</td></tr>
    </table>`;
}

function buildScopeSnapshot(bullets: unknown[]): string {
  if (!bullets.length) return `<p style="font-size:13px;color:#666;">Not specified in the RFP</p>`;
  const items = bullets.slice(0, 6).map(b =>
    `<li style="font-size:13px;color:#1a1a1a;line-height:1.6;margin-bottom:4px;">${esc(s(b))}</li>`
  ).join("");
  return `${sectionHeader("2. Scope Snapshot")}<ul style="margin:6px 0 0;padding-left:20px;">${items}</ul>`;
}

function buildEligibilityTable(rows: Record<string, unknown>[]): string {
  const MAX_EMAIL_ROWS = 8;
  const displayRows = rows.slice(0, MAX_EMAIL_ROWS);
  const overflow = rows.length > MAX_EMAIL_ROWS;

  if (!rows.length) {
    return `${sectionHeader("3. Eligibility Criteria")}
      <p style="font-size:13px;color:#666;">Not found in analyzed document pages — manual review of full RFP recommended.</p>`;
  }

  const headerRow = `<tr>${[
    "#", "Criteria", "Requirement Summary", "Documents / Evidence Required", "Proposal Team Action"
  ].map(th).join("")}</tr>`;

  const bodyRows = displayRows.map((row, i) => {
    const bg = i % 2 === 0 ? "#ffffff" : "#fafafa";
    const docs = arr<string>(row.documents_to_be_submitted);
    const docsHtml = docs.length
      ? docs.map(d => `<li style="margin-bottom:2px;">${esc(s(d))}</li>`).join("")
      : `<li>${esc(s(row.documents_to_be_submitted))}</li>`;

    const mandatoryLabel = s(row.mandatory_or_desirable, "");
    const mandatoryColor = mandatoryLabel.toLowerCase() === "mandatory" ? "color:#cc0000;font-size:11px;" : "color:#555;font-size:11px;";
    const mandatoryBadge = mandatoryLabel
      ? `<br><span style="${mandatoryColor}">[${esc(mandatoryLabel)}]</span>` : "";

    return `<tr style="background:${bg};">
      ${td(esc(s(row.sr_no, String(i + 1))))}
      ${td(`${esc(s(row.criteria_category))}${mandatoryBadge}`)}
      ${td(esc(s(row.eligibility_requirement)))}
      ${td(`<ul style="margin:0;padding-left:16px;">${docsHtml}</ul>`)}
      ${td(esc(s(row.proposal_team_action)))}
    </tr>`;
  }).join("");

  const overflowNote = overflow
    ? `<p style="font-size:12px;color:#555;margin:6px 0 0;font-style:italic;">
        ${rows.length - MAX_EMAIL_ROWS} additional eligibility row(s) captured in the detailed report.</p>`
    : "";

  return `${sectionHeader("3. Eligibility Criteria")}
    <table style="${tableStyle()}">${headerRow}<tbody>${bodyRows}</tbody></table>
    ${overflowNote}`;
}

function buildEvaluationCriteria(ev: Record<string, unknown>): string {
  const rows: Array<[string, string]> = [
    ["Evaluation Process", s(ev.evaluation_process)],
    ["Technical Weightage", s(ev.technical_weightage)],
    ["Commercial Weightage", s(ev.commercial_weightage)],
    ["Min. Technical Qualifying Score", s(ev.minimum_technical_qualifying_score)],
    ["Commercial Bid Opening Rule", s(ev.commercial_bid_opening_rule)],
    ["Final Selection Method", s(ev.final_selection_method)],
  ];

  const specialConditions = arr<string>(ev.special_conditions);
  const specialHtml = specialConditions.length
    ? specialConditions.map(c => `<li style="margin-bottom:3px;">${esc(s(c))}</li>`).join("")
    : "";

  const detailedScoring = arr<unknown>(ev.detailed_scoring_table);
  const scoringNote = detailedScoring.length
    ? `<p style="font-size:12px;color:#555;margin:6px 0 0;font-style:italic;">
        Detailed technical scoring table (${detailedScoring.length} rows) captured in the full report.</p>`
    : "";

  const tableRows = rows.map(([label, value], i) => {
    const bg = i % 2 === 0 ? "#ffffff" : "#fafafa";
    return `<tr style="background:${bg};">
      ${td(`<strong>${esc(label)}</strong>`, "width:38%;")}
      ${td(esc(value))}
    </tr>`;
  }).join("");

  const specialRow = specialHtml
    ? `<tr style="background:#fafafa;">
        ${td("<strong>Special Conditions</strong>", "width:38%;vertical-align:top;")}
        ${td(`<ul style="margin:0;padding-left:16px;">${specialHtml}</ul>`)}
      </tr>`
    : "";

  return `${sectionHeader("4. Evaluation Criteria")}
    <table style="${tableStyle()}"><tbody>${tableRows}${specialRow}</tbody></table>
    ${scoringNote}`;
}

function buildImportantDates(dates: Record<string, unknown>[]): string {
  if (!dates.length) {
    return `${sectionHeader("5. Important Dates")}
      <p style="font-size:13px;color:#666;">Not specified in the RFP</p>`;
  }

  const headerRow = `<tr>${[th("Event"), th("Date / Time"), th("Mode / Notes")].join("")}</tr>`;
  const bodyRows = dates.map((d, i) => {
    const isDeadline = s(d.event).toLowerCase().includes("submission");
    const bg = isDeadline ? "#fff8e6" : i % 2 === 0 ? "#ffffff" : "#fafafa";
    const weight = isDeadline ? "font-weight:bold;" : "";
    return `<tr style="background:${bg};">
      ${td(esc(s(d.event)), weight)}
      ${td(esc(s(d.date_time)), weight)}
      ${td(esc(s(d.mode_notes, "—")))}
    </tr>`;
  }).join("");

  return `${sectionHeader("5. Important Dates")}
    <table style="${tableStyle()}">${headerRow}<tbody>${bodyRows}</tbody></table>`;
}

function buildCommercialRequirements(items: Record<string, unknown>[]): string {
  if (!items.length) {
    return `${sectionHeader("6. Key Commercial & Submission Requirements")}
      <p style="font-size:13px;color:#666;">Not specified in the RFP</p>`;
  }
  const listItems = items.map(item =>
    `<li style="font-size:13px;color:#1a1a1a;line-height:1.8;">
      <strong>${esc(s(item.item))}:</strong> ${esc(s(item.detail))}
    </li>`
  ).join("");
  return `${sectionHeader("6. Key Commercial & Submission Requirements")}
    <ul style="margin:6px 0 0;padding-left:20px;">${listItems}</ul>`;
}

function buildRedFlags(flags: Record<string, unknown>[]): string {
  const display = flags.slice(0, 5);
  if (!display.length) {
    return `${sectionHeader("7. Red Flags & Clarifications")}
      <p style="font-size:13px;color:#666;">No specific red flags identified from analyzed document.</p>`;
  }
  const items = display.map((f, i) => {
    const level = s(f.risk_level, "").toLowerCase();
    const titleColor = level === "high" ? "#cc0000" : level === "medium" ? "#cc6600" : "#1a1a1a";
    return `<li style="font-size:13px;line-height:1.6;margin-bottom:12px;">
      <strong style="color:${titleColor};">${esc(s(f.flag))} [${esc(s(f.risk_level))}]</strong><br>
      ${esc(s(f.detail))}<br>
      <em style="color:#555;font-size:12px;">Action: ${esc(s(f.recommended_action))}</em>
    </li>`;
  }).join("");
  const overflow = flags.length > 5
    ? `<p style="font-size:12px;color:#555;margin:4px 0 0;font-style:italic;">
        ${flags.length - 5} additional flag(s) in the full report.</p>` : "";
  return `${sectionHeader("7. Red Flags & Clarifications")}
    <ol style="margin:6px 0 0;padding-left:20px;">${items}</ol>${overflow}`;
}

// ── Main email builder ────────────────────────────────────────────────────────

function buildEmailHtml(
  analysis: Record<string, unknown>,
  projectTitle: string,
  userEmail: string
): string {
  // Support both old and new JSON shapes
  const full = obj(analysis.full_analysis_json);
  const sj = obj((full.structured_json ?? full) as unknown);

  // Opportunity overview — merge old + new shapes
  const ov: Record<string, unknown> = (() => {
    if (sj.opportunity_overview) return obj(sj.opportunity_overview);
    // Legacy shape fallback
    const snap = obj(full.rfp_snapshot ?? full);
    const bid = obj(full.bid_desk_summary ?? {});
    return {
      client: snap.issuing_authority || bid.issuing_authority || projectTitle,
      rfp_title: snap.rfp_title || bid.rfp_title || projectTitle,
      submission_deadline: snap.submission_deadline,
      recommendation: bid.go_no_go || bid.go_no_go_signal,
      one_line_reason: bid.go_no_go_reasoning || bid.one_line_summary,
    };
  })();

  const scopeSnapshot = arr<unknown>(sj.scope_snapshot);
  const eligRows = arr<Record<string, unknown>>(sj.eligibility_criteria_table);
  const evalCrit = obj(sj.evaluation_criteria ?? {});
  const importantDates = arr<Record<string, unknown>>(sj.important_dates);
  const commercialReqs = arr<Record<string, unknown>>(sj.commercial_and_submission_requirements);
  const redFlags = arr<Record<string, unknown>>(sj.red_flags);

  const rfpTitle = s(ov.rfp_title, projectTitle);
  const client = s(ov.client, "");
  const name = senderName(userEmail);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>RFP Intelligence Brief — ${esc(rfpTitle)}</title>
</head>
<body style="margin:0;padding:20px;background:#f4f4f4;font-family:Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;">

    <!-- Top accent bar -->
    <div style="height:6px;background:#0f1b2e;"></div>

    <!-- Header -->
    <div style="padding:20px 28px 16px;border-bottom:1px solid #e5e5e5;">
      <div style="font-size:18px;font-weight:bold;color:#0f1b2e;">ProposalPilot BFSI</div>
      <div style="font-size:12px;color:#888;margin-top:3px;">Intelligence Brief &mdash; Confidential &mdash; For Internal Use Only</div>
    </div>

    <!-- Body -->
    <div style="padding:24px 28px 32px;">

      <p style="font-size:14px;color:#1a1a1a;margin:0 0 6px;line-height:1.6;">Dear Team,</p>
      <p style="font-size:14px;color:#1a1a1a;margin:0 0 16px;line-height:1.6;">
        Please find below the RFP intelligence brief for the opportunity listed. PFB the synopsis.
      </p>
      <hr style="border:none;border-top:1px solid #ddd;margin:0 0 20px;">

      ${buildOpportunityOverview(ov)}
      ${buildScopeSnapshot(scopeSnapshot)}
      ${buildEligibilityTable(eligRows)}
      ${buildEvaluationCriteria(evalCrit)}
      ${buildImportantDates(importantDates)}
      ${buildCommercialRequirements(commercialReqs)}
      ${buildRedFlags(redFlags)}

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

// ── Validation ────────────────────────────────────────────────────────────────

function validateEmailContent(sj: Record<string, unknown>): string[] {
  const warnings: string[] = [];
  const ov = obj(sj.opportunity_overview ?? {});
  const evalCrit = obj(sj.evaluation_criteria ?? {});
  const eligRows = arr<Record<string, unknown>>(sj.eligibility_criteria_table);

  if (!s(ov.submission_deadline).includes("Not specified") && !ov.submission_deadline)
    warnings.push("Submission deadline missing");

  if (!evalCrit.technical_weightage && !evalCrit.evaluation_process)
    warnings.push("Evaluation criteria not extracted");

  if (!eligRows.length)
    warnings.push("No eligibility criteria found — manual review recommended");

  const hasEyAssessment = eligRows.some(r =>
    String(r.ey_assessment || "").toLowerCase().includes("can meet") ||
    String(r.ey_assessment || "").toLowerCase().includes("cannot meet")
  );
  if (hasEyAssessment)
    warnings.push("EY Assessment found in eligibility — should be removed from email");

  return warnings;
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
    const fullJson = obj(analysis.full_analysis_json);
    const sj = obj((fullJson.structured_json ?? fullJson) as unknown);
    const ov = obj(sj.opportunity_overview ?? fullJson.rfp_snapshot ?? {});
    const bid = obj(fullJson.bid_desk_summary ?? {});

    const client_ = s(ov.client || ov.issuing_authority || bid.issuing_authority, "");
    const rfpTitle = s(ov.rfp_title || bid.rfp_title || projectTitle, "RFP Intelligence Brief");

    const subject = client_
      ? `${client_} — ${rfpTitle} | RFP Intelligence Brief | ProposalPilot BFSI`
      : `${rfpTitle} | RFP Intelligence Brief | ProposalPilot BFSI`;

    // Run validation warnings (logged but not blocking)
    const warnings = validateEmailContent(sj);
    if (warnings.length) console.warn("Email validation warnings:", warnings);

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
      JSON.stringify({ success: true, sent_to: to, resend_id: resendResult.id, warnings }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
