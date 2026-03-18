import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

async function getSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    );
}

/**
 * PDF Export: Generates a defect report for a project.
 * Pro-only feature — checks subscription tier before generating.
 *
 * GET /api/guardian/export-pdf?projectId=xxx
 */
export async function GET(req: NextRequest) {
    const projectId = req.nextUrl.searchParams.get("projectId");
    if (!projectId) {
        return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check pro access
    const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, is_admin, trial_ends_at")
        .eq("id", user.id)
        .single();

    const tier = profile?.subscription_tier || "free";
    const isAdmin = profile?.is_admin === true;
    const trialActive = tier === "trial" && profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
    const hasPro = tier === "guardian_pro" || isAdmin || trialActive;

    if (!hasPro) {
        return NextResponse.json({ error: "PDF export requires Guardian Pro" }, { status: 403 });
    }

    // Fetch project
    const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single();

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch defects
    const { data: defects } = await supabase
        .from("defects")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

    // Fetch variations
    const { data: variations } = await supabase
        .from("variations")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

    // Build PDF
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const TEAL = rgb(13 / 255, 110 / 255, 110 / 255);
    const BLACK = rgb(0, 0, 0);
    const GRAY = rgb(0.4, 0.45, 0.5);
    const RED = rgb(0.86, 0.15, 0.15);
    const PAGE_W = 595;
    const PAGE_H = 842;
    const MARGIN = 50;
    const LINE_H = 16;

    let page = pdf.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - MARGIN;

    function addPage() {
        page = pdf.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN;
    }

    function checkSpace(needed: number) {
        if (y - needed < MARGIN) addPage();
    }

    function drawText(text: string, x: number, opts: { font?: typeof font; size?: number; color?: typeof BLACK } = {}) {
        const f = opts.font || font;
        const s = opts.size || 10;
        const c = opts.color || BLACK;
        // Truncate if too wide
        const maxW = PAGE_W - x - MARGIN;
        let t = text;
        while (f.widthOfTextAtSize(t, s) > maxW && t.length > 3) {
            t = t.slice(0, -4) + "...";
        }
        page.drawText(t, { x, y, size: s, font: f, color: c });
    }

    // Header
    drawText("HOMEOWNER GUARDIAN", MARGIN, { font: fontBold, size: 18, color: TEAL });
    y -= 24;
    drawText("Defect & Variation Report", MARGIN, { font: fontBold, size: 13, color: GRAY });
    y -= 8;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: TEAL });
    y -= 20;

    // Project details
    drawText("Project Details", MARGIN, { font: fontBold, size: 12, color: TEAL });
    y -= LINE_H;
    const details = [
        ["Project Name", project.name],
        ["Builder", project.builder_name || "—"],
        ["Address", project.address || "—"],
        ["Contract Value", project.contract_value ? `$${Number(project.contract_value).toLocaleString()}` : "—"],
        ["State", project.state || "—"],
        ["Status", project.status || "—"],
        ["Report Date", new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })],
    ];
    for (const [label, value] of details) {
        drawText(`${label}:`, MARGIN, { font: fontBold, size: 9, color: GRAY });
        drawText(String(value), MARGIN + 110, { size: 9 });
        y -= LINE_H;
    }
    y -= 10;

    // Defects section
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: GRAY });
    y -= 16;
    drawText(`Defects (${defects?.length || 0})`, MARGIN, { font: fontBold, size: 12, color: RED });
    y -= LINE_H;

    if (defects && defects.length > 0) {
        for (const defect of defects) {
            checkSpace(80);
            drawText(defect.title || "Untitled Defect", MARGIN, { font: fontBold, size: 10 });
            y -= LINE_H;
            drawText(`Status: ${defect.status || "open"}`, MARGIN + 10, { size: 9, color: GRAY });
            drawText(`Severity: ${defect.severity || "—"}`, MARGIN + 160, { size: 9, color: GRAY });
            y -= LINE_H;
            if (defect.description) {
                const desc = defect.description.length > 120 ? defect.description.slice(0, 117) + "..." : defect.description;
                drawText(desc, MARGIN + 10, { size: 9, color: GRAY });
                y -= LINE_H;
            }
            if (defect.location) {
                drawText(`Location: ${defect.location}`, MARGIN + 10, { size: 9, color: GRAY });
                y -= LINE_H;
            }
            const created = defect.created_at ? new Date(defect.created_at).toLocaleDateString("en-AU") : "—";
            drawText(`Reported: ${created}`, MARGIN + 10, { size: 9, color: GRAY });
            y -= LINE_H + 6;
        }
    } else {
        drawText("No defects recorded.", MARGIN + 10, { size: 9, color: GRAY });
        y -= LINE_H;
    }

    // Variations section
    y -= 10;
    checkSpace(40);
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: GRAY });
    y -= 16;
    drawText(`Variations (${variations?.length || 0})`, MARGIN, { font: fontBold, size: 12, color: TEAL });
    y -= LINE_H;

    if (variations && variations.length > 0) {
        for (const v of variations) {
            checkSpace(60);
            drawText(v.description || "Untitled Variation", MARGIN, { font: fontBold, size: 10 });
            y -= LINE_H;
            const cost = v.additional_cost ? `$${Number(v.additional_cost).toLocaleString()}` : "$0";
            drawText(`Cost: ${cost}`, MARGIN + 10, { size: 9, color: GRAY });
            drawText(`Status: ${v.status || "pending"}`, MARGIN + 160, { size: 9, color: GRAY });
            y -= LINE_H;
            const created = v.created_at ? new Date(v.created_at).toLocaleDateString("en-AU") : "—";
            drawText(`Date: ${created}`, MARGIN + 10, { size: 9, color: GRAY });
            y -= LINE_H + 6;
        }
    } else {
        drawText("No variations recorded.", MARGIN + 10, { size: 9, color: GRAY });
        y -= LINE_H;
    }

    // Footer
    checkSpace(40);
    y -= 10;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: GRAY });
    y -= 14;
    drawText("Generated by VedaWell HomeOwner Guardian — vedawellapp.com", MARGIN, { size: 8, color: GRAY });
    y -= 12;
    drawText("This report is for record-keeping purposes. Consult a building inspector or solicitor for legal advice.", MARGIN, { size: 7, color: GRAY });

    const pdfBytes = await pdf.save();

    return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="guardian-report-${project.name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf"`,
        },
    });
}
