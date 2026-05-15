import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function safeStr(val: unknown, fallback = "Not specified"): string {
  if (val === null || val === undefined || val === "") return fallback;
  return String(val);
}

function safeArr<T>(val: unknown): T[] {
  if (!val || !Array.isArray(val)) return [];
  return val as T[];
}

function safeObj(val: unknown): Record<string, unknown> {
  if (!val || typeof val !== "object" || Array.isArray(val)) return {};
  return val as Record<string, unknown>;
}

function buildEmailHtml(analysis: Record<string, unknown>, projectTitle: string): string {
  const full = safeObj(analysis.full_analysis_json);
  const snap = safeObj(full.rfp_snapshot);
  const bidDesk = safeObj(full.bid_desk_summary);

  const rfpTitle = safeStr(snap.rfp_title || projectTitle, "RFP Intelligence Brief");
  const issuingAuthority = safeStr(snap.issuing_authority, "");
  const goNoGo = safeStr(bidDesk.go_no_go || bidDesk.go_no_go_signal, "Pending Analysis");
  const reasoning = safeStr(bidDesk.go_no_go_reasoning || bidDesk.one_line_summary, "");
  const submissionDeadline = safeStr(snap.submission_deadline, "Not specified");
  const contractValue = safeStr(snap.contract_value || snap.estimated_contract_value, "Not specified");
  const emdAmount = safeStr(snap.emd_amount, "Not specified");
  const contractDuration = safeStr(snap.contract_duration, "Not specified");
  const evaluationMethod = safeStr(snap.evaluation_method, "Not specified");

  const goNoGoLower = goNoGo.toLowerCase();
  const badgeClass = goNoGoLower === "pursue"
    ? "badge-pursue"
    : goNoGoLower.includes("caution")
    ? "badge-caution"
    : "badge-no";

  const topRisks = safeArr<string>(bidDesk.top_risks);
  const immediateActions = safeArr<string>(bidDesk.immediate_actions);

  const topRisksHtml = topRisks.length > 0
    ? topRisks.slice(0, 3).map(r => `<div class="risk-item">${safeStr(r)}</div>`).join("")
    : '<p style="color:#999;font-size:14px">No specific risks flagged.</p>';

  const immediateActionsHtml = immediateActions.length > 0
    ? immediateActions.slice(0, 5).map(a => `<div class="action-item">${safeStr(a)}</div>`).join("")
    : '<p style="color:#999;font-size:14px">No immediate actions specified.</p>';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #030712; padding: 24px; }
    .header h1 { color: #00E5FF; font-size: 20px; margin: 0; letter-spacing: -0.5px; }
    .header p { color: #9CAEC4; font-size: 13px; margin: 4px 0 0; }
    .badge-pursue { background: #00F5A0; color: #030712; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; display: inline-block; margin: 16px 0; }
    .badge-caution { background: #FFB020; color: #030712; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; display: inline-block; margin: 16px 0; }
    .badge-no { background: #FF4D6D; color: #ffffff; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; display: inline-block; margin: 16px 0; }
    .section { padding: 20px 24px; border-bottom: 1px solid #f0f0f0; }
    .section h2 { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px; font-weight: 600; }
    .rfp-title { font-size: 20px; font-weight: bold; color: #111; margin: 0 0 4px; line-height: 1.3; }
    .rfp-institution { color: #666; font-size: 14px; margin: 0; }
    .reasoning { font-size: 14px; color: #444; margin: 12px 0 0; line-height: 1.6; }
    .snapshot-table { width: 100%; border-collapse: collapse; }
    .snapshot-table td { padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f5f5f5; vertical-align: top; }
    .snapshot-table td:first-child { color: #888; width: 45%; font-size: 13px; }
    .snapshot-table td:last-child { color: #111; font-weight: 500; }
    .snapshot-table tr:last-child td { border-bottom: none; }
    .deadline-value { color: #E05700; font-weight: 700; }
    .risk-item { background: #fff5f5; border-left: 3px solid #FF4D6D; padding: 10px 12px; margin: 8px 0; border-radius: 4px; font-size: 14px; color: #333; line-height: 1.5; }
    .action-item { padding: 10px 0; font-size: 14px; color: #333; border-bottom: 1px solid #f5f5f5; line-height: 1.5; }
    .action-item:last-child { border-bottom: none; }
    .action-item:before { content: "→ "; color: #00B8CC; font-weight: bold; }
    .footer { background: #f9f9f9; padding: 20px 24px; text-align: center; }
    .footer p { color: #bbb; font-size: 12px; margin: 0; }
    .footer .branding { color: #030712; font-weight: 600; font-size: 13px; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ProposalPilot BFSI</h1>
      <p>Intelligence Brief — Confidential</p>
    </div>
    <div class="section">
      <h2>RFP Overview</h2>
      <p class="rfp-title">${rfpTitle}</p>
      ${issuingAuthority ? `<p class="rfp-institution">${issuingAuthority}</p>` : ""}
      <div><span class="${badgeClass}">${goNoGo}</span></div>
      ${reasoning ? `<p class="reasoning">${reasoning}</p>` : ""}
    </div>
    <div class="section">
      <h2>RFP Snapshot</h2>
      <table class="snapshot-table">
        <tr><td>Submission Deadline</td><td class="deadline-value">${submissionDeadline}</td></tr>
        <tr><td>Contract Value</td><td>${contractValue}</td></tr>
        <tr><td>EMD Amount</td><td>${emdAmount}</td></tr>
        <tr><td>Contract Duration</td><td>${contractDuration}</td></tr>
        <tr><td>Evaluation Method</td><td>${evaluationMethod}</td></tr>
      </table>
    </div>
    <div class="section">
      <h2>Top Risks</h2>
      ${topRisksHtml}
    </div>
    <div class="section">
      <h2>Immediate Actions</h2>
      ${immediateActionsHtml}
    </div>
    <div class="footer">
      <p class="branding">ProposalPilot BFSI</p>
      <p>Confidential &nbsp;·&nbsp; For internal use only &nbsp;·&nbsp; Prepared by ProposalPilot BFSI</p>
    </div>
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
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
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

    const projectTitle = safeStr((analysis.rfp_projects as Record<string, unknown>)?.title, "RFP Intelligence Brief");
    const full = safeObj(analysis.full_analysis_json);
    const snap = safeObj(full.rfp_snapshot);
    const rfpTitle = safeStr(snap.rfp_title || projectTitle, "RFP Intelligence Brief");
    const htmlContent = buildEmailHtml(analysis as Record<string, unknown>, projectTitle);
    const noteSection = note ? `\n\nNote from sender: ${note}` : "";

    const resendPayload = {
      from: "ProposalPilot BFSI <onboarding@resend.dev>",
      to,
      subject: `Intelligence Brief: ${rfpTitle} | ProposalPilot BFSI`,
      html: htmlContent,
      text: `Intelligence Brief: ${rfpTitle}\n\nSent via ProposalPilot BFSI from ${userEmail}.${noteSection}`,
    };

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      return new Response(JSON.stringify({ error: resendData.message || "Failed to send email via Resend." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, sent_to: to, resend_id: resendData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
