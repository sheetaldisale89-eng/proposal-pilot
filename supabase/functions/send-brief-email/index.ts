import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function s(val: unknown, fallback = "Not specified"): string {
  if (val === null || val === undefined || val === "") return fallback;
  return String(val);
}

function arr<T>(val: unknown): T[] {
  if (!val || !Array.isArray(val)) return [];
  return val as T[];
}

function obj(val: unknown): Record<string, unknown> {
  if (!val || typeof val !== "object" || Array.isArray(val)) return {};
  return val as Record<string, unknown>;
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function senderFirstName(email: string): string {
  const local = email.split("@")[0] || "";
  const first = local.split(".")[0] || local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function goBadgeInline(goNoGo: string): string {
  const v = goNoGo.toLowerCase();
  if (v === "pursue") {
    return `<span style="display:inline-block;padding:3px 12px;border-radius:12px;background:#d4f8e8;color:#1a7a4a;font-weight:bold;font-size:13px;">${esc(goNoGo)}</span>`;
  }
  if (v.includes("caution")) {
    return `<span style="display:inline-block;padding:3px 12px;border-radius:12px;background:#fff3cd;color:#856404;font-weight:bold;font-size:13px;">${esc(goNoGo)}</span>`;
  }
  return `<span style="display:inline-block;padding:3px 12px;border-radius:12px;background:#fde8e8;color:#cc0000;font-weight:bold;font-size:13px;">${esc(goNoGo)}</span>`;
}

function sectionHeader(title: string): string {
  return `<h2 style="font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:#0f1b2e;text-decoration:underline;margin:28px 0 10px;">${esc(title)}</h2>`;
}

function buildEmailHtml(analysis: Record<string, unknown>, projectTitle: string, userEmail: string): string {
  const full = obj(analysis.full_analysis_json);
  const snap = obj(full.rfp_snapshot);
  const bidDesk = obj(full.bid_desk_summary);

  const rfpTitle = s(snap.rfp_title || bidDesk.rfp_title || projectTitle, "RFP Intelligence Brief");
  const issuingAuthority = s(snap.issuing_authority || bidDesk.issuing_authority, "");
  const goNoGo = s(bidDesk.go_no_go || bidDesk.go_no_go_signal, "Pending");
  const goNoGoReasoning = s(bidDesk.go_no_go_reasoning || bidDesk.one_line_summary, "");

  // ── Subject line subject (also used in header)
  const subjectDisplay = issuingAuthority
    ? `${esc(issuingAuthority)} — ${esc(rfpTitle)}`
    : esc(rfpTitle);

  // ── Scope of Work
  const scopeItems = arr<Record<string, unknown>>(full.scope_of_work);
  let scopeHtml = "";
  let allDeliverables: string[] = [];
  if (scopeItems.length > 0) {
    scopeHtml = `<ol style="margin:8px 0 0;padding-left:20px;">`;
    scopeItems.forEach((ws, i) => {
      const wsTitle = s(ws.workstream, `Workstream ${i + 1}`);
      const what = s(ws.what_bank_wants, "");
      const delivs = arr<string>(ws.deliverables);
      allDeliverables = allDeliverables.concat(delivs);
      scopeHtml += `<li style="margin-bottom:10px;font-size:14px;line-height:1.6;color:#1a1a1a;">
        <strong>${esc(wsTitle)}:</strong> ${esc(what)}
      </li>`;
    });
    scopeHtml += `</ol>`;
  } else {
    scopeHtml = `<p style="font-size:14px;color:#666;">Not extracted from this document.</p>`;
  }

  let deliverablesHtml = "";
  if (allDeliverables.length > 0) {
    deliverablesHtml = `<p style="margin:16px 0 6px;font-size:14px;"><strong>Key Deliverables:</strong></p>
    <ol style="margin:0;padding-left:20px;">
      ${allDeliverables.map(d => `<li style="font-size:14px;line-height:1.6;color:#1a1a1a;margin-bottom:4px;">${esc(d)}</li>`).join("")}
    </ol>`;
  }

  // ── Eligibility Criteria
  const eligItems = arr<Record<string, unknown>>(full.eligibility_criteria);
  let eligHtml = "";
  if (eligItems.length > 0) {
    // Mandatory first, then desirable
    const sorted = [...eligItems].sort((a, b) => {
      const am = a.mandatory === true || String(a.mandatory).toLowerCase() === "true" ? 0 : 1;
      const bm = b.mandatory === true || String(b.mandatory).toLowerCase() === "true" ? 0 : 1;
      return am - bm;
    });
    eligHtml = `<ol style="margin:8px 0 0;padding-left:20px;">`;
    sorted.forEach(item => {
      const criterion = s(item.criterion, "");
      const req = s(item.requirement, "");
      const mandatory = item.mandatory === true || String(item.mandatory).toLowerCase() === "true";
      const evidence = s(item.evidence_required, "");
      const eyAssess = s(item.ey_assessment, "");
      const subPoints = arr<string>(item.sub_criteria);
      eligHtml += `<li style="margin-bottom:12px;font-size:14px;line-height:1.6;color:#1a1a1a;">
        <strong>${esc(criterion)}${mandatory ? ' <span style="color:#cc0000;">[Mandatory]</span>' : ' <span style="color:#666;">[Desirable]</span>'}:</strong> ${esc(req)}
        ${evidence ? `<br><span style="color:#555;font-size:13px;">Evidence: ${esc(evidence)}</span>` : ""}
        ${eyAssess ? `<br><span style="color:#555;font-size:13px;">EY Assessment: ${esc(eyAssess)}</span>` : ""}
        ${subPoints.length > 0 ? `<ul style="margin:4px 0 0;padding-left:18px;">${subPoints.map(sp => `<li style="font-size:13px;color:#444;margin-bottom:2px;">${esc(s(sp))}</li>`).join("")}</ul>` : ""}
      </li>`;
    });
    eligHtml += `</ol>`;
  } else {
    eligHtml = `<p style="font-size:14px;color:#666;">Not extracted from this document.</p>`;
  }

  // ── Evaluation Criteria table
  const evalItems = arr<Record<string, unknown>>(full.evaluation_criteria);
  const evalMethod = s(snap.evaluation_method, "");
  let evalHtml = "";
  if (evalMethod) {
    evalHtml += `<p style="font-size:14px;margin:0 0 10px;"><strong>Evaluation Method:</strong> ${esc(evalMethod)}</p>`;
  }
  if (evalItems.length > 0) {
    evalHtml += `<table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f0f3f7;">
          <th style="border:1px solid #ddd;padding:8px 12px;text-align:left;color:#0f1b2e;">Stage</th>
          <th style="border:1px solid #ddd;padding:8px 12px;text-align:left;color:#0f1b2e;">Criterion</th>
          <th style="border:1px solid #ddd;padding:8px 12px;text-align:left;color:#0f1b2e;">Parameters</th>
          <th style="border:1px solid #ddd;padding:8px 12px;text-align:right;color:#0f1b2e;">Marks</th>
          <th style="border:1px solid #ddd;padding:8px 12px;text-align:right;color:#0f1b2e;">Max</th>
        </tr>
      </thead>
      <tbody>
        ${evalItems.map((row, i) => {
          const bg = i % 2 === 0 ? "#ffffff" : "#fafafa";
          const stage = s(row.stage, "");
          const criterion = s(row.criterion, "");
          const subCriterion = s(row.sub_criterion, "");
          const criterionDisplay = subCriterion && subCriterion !== criterion ? `${esc(criterion)}<br><span style="color:#555;font-size:12px;">${esc(subCriterion)}</span>` : esc(criterion);
          const params = s(row.parameters, "");
          const marks = row.marks !== undefined && row.marks !== null && row.marks !== "" ? String(row.marks) : "—";
          const maxMarks = row.max_marks !== undefined && row.max_marks !== null && row.max_marks !== "" ? String(row.max_marks) : "—";
          return `<tr style="background:${bg};">
            <td style="border:1px solid #ddd;padding:8px 12px;color:#1a1a1a;vertical-align:top;">${esc(stage)}</td>
            <td style="border:1px solid #ddd;padding:8px 12px;color:#1a1a1a;vertical-align:top;">${criterionDisplay}</td>
            <td style="border:1px solid #ddd;padding:8px 12px;color:#1a1a1a;vertical-align:top;">${esc(params)}</td>
            <td style="border:1px solid #ddd;padding:8px 12px;color:#1a1a1a;text-align:right;vertical-align:top;">${esc(marks)}</td>
            <td style="border:1px solid #ddd;padding:8px 12px;color:#1a1a1a;text-align:right;vertical-align:top;">${esc(maxMarks)}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>`;
  } else {
    evalHtml += `<p style="font-size:14px;color:#666;">Not extracted from this document.</p>`;
  }

  // ── Important Dates table
  const dateRows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: "Release Date", value: s(snap.release_date, "") },
    { label: "Pre-Bid Meeting Date", value: s(snap.pre_bid_meeting || snap.pre_bid_meeting_date, "") },
    { label: "Query / Clarification Deadline", value: s(snap.clarification_deadline, "") },
    { label: "Submission Deadline", value: s(snap.submission_deadline, ""), highlight: true },
    { label: "Bid Opening Date", value: s(snap.bid_opening_date, "") },
  ].filter(r => r.value && r.value !== "Not specified");

  let datesHtml = "";
  if (dateRows.length > 0) {
    datesHtml = `<table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f0f3f7;">
          <th style="border:1px solid #ddd;padding:8px 12px;text-align:left;color:#0f1b2e;">Event</th>
          <th style="border:1px solid #ddd;padding:8px 12px;text-align:left;color:#0f1b2e;">Date / Details</th>
        </tr>
      </thead>
      <tbody>
        ${dateRows.map((r, i) => {
          const bg = r.highlight ? "#fff8e6" : i % 2 === 0 ? "#ffffff" : "#fafafa";
          const fontWeight = r.highlight ? "bold" : "normal";
          return `<tr style="background:${bg};">
            <td style="border:1px solid #ddd;padding:8px 12px;color:#1a1a1a;font-weight:${fontWeight};">${esc(r.label)}</td>
            <td style="border:1px solid #ddd;padding:8px 12px;color:#1a1a1a;font-weight:${fontWeight};">${esc(r.value)}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>`;
  } else {
    datesHtml = `<p style="font-size:14px;color:#666;">No dates extracted from this document.</p>`;
  }

  // ── Key Commercial Terms
  const commercialRows: Array<{ label: string; value: string }> = [
    { label: "EMD", value: s(snap.emd_amount, "") },
    { label: "Performance Bank Guarantee", value: s(snap.performance_guarantee, "") },
    { label: "Contract Duration", value: s(snap.contract_duration, "") },
    { label: "Contract Value", value: s(snap.contract_value, "") },
    { label: "Submission Mode", value: s(snap.submission_mode, "") },
    { label: "Tender Fee", value: s(snap.tender_fee, "") },
  ].filter(r => r.value && r.value !== "Not specified");

  let commercialHtml = "";
  if (commercialRows.length > 0) {
    commercialHtml = `<ul style="margin:8px 0 0;padding-left:20px;">
      ${commercialRows.map(r => `<li style="font-size:14px;line-height:1.8;color:#1a1a1a;"><strong>${esc(r.label)}:</strong> ${esc(r.value)}</li>`).join("")}
    </ul>`;
  } else {
    commercialHtml = `<p style="font-size:14px;color:#666;">Not extracted from this document.</p>`;
  }

  // ── Red Flags
  const redFlags = arr<Record<string, unknown>>(full.red_flags);
  let redFlagsHtml = "";
  if (redFlags.length > 0) {
    redFlagsHtml = `<ol style="margin:8px 0 0;padding-left:20px;">`;
    redFlags.forEach(flag => {
      const flagTitle = s(flag.flag, "");
      const detail = s(flag.detail, "");
      const riskLevel = s(flag.risk_level, "").toLowerCase();
      const action = s(flag.recommended_action, "");
      const titleColor = riskLevel === "high" ? "#cc0000" : riskLevel === "medium" ? "#cc6600" : "#1a1a1a";
      redFlagsHtml += `<li style="margin-bottom:14px;font-size:14px;line-height:1.6;">
        <strong style="color:${titleColor};">${esc(flagTitle)} (${esc(s(flag.risk_level, ""))})</strong><br>
        ${esc(detail)}<br>
        <em style="color:#555;font-size:13px;">Action: ${esc(action)}</em>
      </li>`;
    });
    redFlagsHtml += `</ol>`;
  } else {
    redFlagsHtml = `<p style="font-size:14px;color:#666;">No specific red flags identified.</p>`;
  }

  // ── Clarification Questions — High priority first, then Medium
  const clarQs = arr<Record<string, unknown>>(full.clarification_questions);
  const highQs = clarQs.filter(q => s(q.priority, "").toLowerCase() === "high");
  const medQs = clarQs.filter(q => s(q.priority, "").toLowerCase() === "medium");
  const otherQs = clarQs.filter(q => !["high", "medium"].includes(s(q.priority, "").toLowerCase()));
  const sortedQs = [...highQs, ...medQs, ...otherQs];

  let clarHtml = "";
  if (sortedQs.length > 0) {
    clarHtml = `<ol style="margin:8px 0 0;padding-left:20px;">`;
    sortedQs.forEach(q => {
      const question = s(q.question, "");
      const whyCritical = s(q.why_critical, "");
      const priority = s(q.priority, "");
      const priorityColor = priority.toLowerCase() === "high" ? "#cc0000" : "#cc6600";
      clarHtml += `<li style="margin-bottom:12px;font-size:14px;line-height:1.6;color:#1a1a1a;">
        ${esc(question)} <span style="font-size:12px;color:${priorityColor};font-weight:bold;">[${esc(priority)}]</span>
        ${whyCritical ? `<br><em style="font-size:13px;color:#555;">${esc(whyCritical)}</em>` : ""}
      </li>`;
    });
    clarHtml += `</ol>`;
  } else {
    clarHtml = `<p style="font-size:14px;color:#666;">No clarification questions extracted.</p>`;
  }

  // ── Go/No-Go reasoning as numbered points
  let goNoGoReasHtml = "";
  if (goNoGoReasoning) {
    // Try to split on numbered points, newlines, or semicolons
    const rawPoints = goNoGoReasoning
      .split(/\n|;\s*|\d+\.\s+/)
      .map(p => p.trim())
      .filter(p => p.length > 10);
    if (rawPoints.length > 1) {
      goNoGoReasHtml = `<ol style="margin:6px 0 0;padding-left:20px;">
        ${rawPoints.map(p => `<li style="font-size:14px;line-height:1.6;color:#1a1a1a;margin-bottom:4px;">${esc(p)}</li>`).join("")}
      </ol>`;
    } else {
      goNoGoReasHtml = `<p style="font-size:14px;line-height:1.6;color:#1a1a1a;margin:6px 0 0;">${esc(goNoGoReasoning)}</p>`;
    }
  }

  const senderName = senderFirstName(userEmail);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>RFP Intelligence Brief — ${esc(rfpTitle)}</title>
</head>
<body style="margin:0;padding:20px;background:#f4f4f4;font-family:Arial,sans-serif;">
  <div style="max-width:650px;margin:0 auto;background:#ffffff;">

    <!-- Top accent bar -->
    <div style="height:6px;background:#0f1b2e;"></div>

    <!-- Header -->
    <div style="padding:20px 28px 16px;border-bottom:1px solid #e5e5e5;">
      <div style="font-size:18px;font-weight:bold;color:#0f1b2e;font-family:Arial,sans-serif;">ProposalPilot BFSI</div>
      <div style="font-size:13px;color:#888;margin-top:3px;">Intelligence Brief &mdash; Confidential</div>
    </div>

    <!-- Body -->
    <div style="padding:24px 28px 32px;">

      <!-- Salutation -->
      <p style="font-size:14px;color:#1a1a1a;margin:0 0 6px;line-height:1.6;">Dear Team,</p>
      <p style="font-size:14px;color:#1a1a1a;margin:0 0 16px;line-height:1.6;">
        Please find attached the RFP intelligence brief for the opportunity below. PFB the synopsis.
      </p>

      <hr style="border:none;border-top:1px solid #ddd;margin:0 0 20px;">

      <!-- Section 1 — Opportunity Overview -->
      ${sectionHeader("Opportunity Overview")}
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:5px 0;width:38%;color:#555;vertical-align:top;">Client:</td>
          <td style="padding:5px 0;color:#1a1a1a;font-weight:bold;vertical-align:top;">${esc(issuingAuthority || "Not specified")}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#555;vertical-align:top;">RFP Title:</td>
          <td style="padding:5px 0;color:#1a1a1a;vertical-align:top;">${esc(rfpTitle)}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#555;vertical-align:top;">Recommendation:</td>
          <td style="padding:5px 0;vertical-align:top;">${goBadgeInline(goNoGo)}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#555;vertical-align:top;">Go/No-Go Reasoning:</td>
          <td style="padding:5px 0;vertical-align:top;">${goNoGoReasHtml}</td>
        </tr>
      </table>

      <!-- Section 2 — Brief Scope of Work -->
      ${sectionHeader("Brief Scope of Work:")}
      ${scopeHtml}
      ${deliverablesHtml}

      <!-- Section 3 — Critical Eligibility Criteria -->
      ${sectionHeader("Critical Eligibility Criteria:")}
      ${eligHtml}

      <!-- Section 4 — Evaluation Criteria -->
      ${sectionHeader("Evaluation Criteria:")}
      ${evalHtml}

      <!-- Section 5 — Important Dates -->
      ${sectionHeader("Important Dates:")}
      ${datesHtml}

      <!-- Section 6 — Key Commercial Terms -->
      ${sectionHeader("Key Commercial Terms:")}
      ${commercialHtml}

      <!-- Section 7 — Red Flags -->
      ${sectionHeader("Red Flags to Watch:")}
      ${redFlagsHtml}

      <!-- Section 8 — Clarification Questions -->
      ${sectionHeader("Key Questions to Raise at Pre-Bid:")}
      ${clarHtml}

      <!-- Sign-off -->
      <hr style="border:none;border-top:1px solid #ddd;margin:28px 0 16px;">
      <p style="font-size:14px;color:#1a1a1a;margin:0 0 6px;">Best Regards,</p>
      <p style="font-size:14px;color:#1a1a1a;margin:0 0 2px;">${esc(senderName)}</p>
      <p style="font-size:12px;color:#888;margin:0 0 2px;">Prepared using ProposalPilot BFSI</p>
      <p style="font-size:12px;color:#bbb;margin:0;">Confidential &nbsp;&middot;&nbsp; For internal use only</p>

    </div>

    <!-- Bottom bar -->
    <div style="height:3px;background:#0f1b2e;"></div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { to, projectId, userEmail, note } = await req.json() as {
      to: string[];
      projectId: string;
      userEmail: string;
      note?: string;
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!Deno.env.get("RESEND_API_KEY")) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured. Please add it to Supabase Edge Function secrets." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = createClient(supabaseUrl, supabaseKey);

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
    const snap = obj(full.rfp_snapshot);
    const bidDesk = obj(full.bid_desk_summary);
    const issuingAuthority = s(snap.issuing_authority || bidDesk.issuing_authority, "");
    const rfpTitle = s(snap.rfp_title || bidDesk.rfp_title || projectTitle, "RFP Intelligence Brief");

    const subject = issuingAuthority
      ? `${issuingAuthority} — ${rfpTitle} | RFP Intelligence Brief | ProposalPilot BFSI`
      : `${rfpTitle} | RFP Intelligence Brief | ProposalPilot BFSI`;

    const emailHtml = buildEmailHtml(analysis as Record<string, unknown>, projectTitle, userEmail);
    const recipientEmails = to;

    const resendResponse = await fetch(
      'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'ProposalPilot BFSI <onboarding@resend.dev>',
          to: recipientEmails,
          subject,
          html: emailHtml
        })
      }
    );
    const resendResult = await resendResponse.json();
    console.log('Resend result:', JSON.stringify(resendResult));
    if (!resendResponse.ok) {
      throw new Error(`Resend failed: ${JSON.stringify(resendResult)}`);
    }

    return new Response(JSON.stringify({ success: true, sent_to: to, resend_id: resendResult.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
