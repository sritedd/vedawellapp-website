import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { generateICS, type CalendarEvent } from "@/lib/ics-export";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, address")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const include = url.searchParams.get("include") || "all";
    const events: CalendarEvent[] = [];
    const location = project.address || "";

    // Fetch inspections / site visits
    if (include === "all" || include.includes("inspections")) {
      const { data: visits } = await supabase
        .from("site_visits")
        .select("id, visit_date, notes")
        .eq("project_id", projectId)
        .not("visit_date", "is", null);

      if (visits) {
        for (const v of visits) {
          events.push({
            uid: `visit-${v.id}@vedawell`,
            title: `Site Visit — ${project.name}`,
            description: v.notes || "Scheduled site visit",
            startDate: new Date(v.visit_date),
            location,
          });
        }
      }
    }

    // Fetch payments
    if (include === "all" || include.includes("payments")) {
      const { data: payments } = await supabase
        .from("payments")
        .select("id, stage_name, amount, due_date")
        .eq("project_id", projectId)
        .not("due_date", "is", null);

      if (payments) {
        for (const p of payments) {
          events.push({
            uid: `payment-${p.id}@vedawell`,
            title: `Payment Due: ${p.stage_name || "Progress Payment"} — $${p.amount || 0}`,
            description: `Progress payment for ${p.stage_name || "milestone"}`,
            startDate: new Date(p.due_date),
            location,
          });
        }
      }
    }

    // Fetch defects with SLA deadlines
    if (include === "all" || include.includes("defects")) {
      const { data: defects } = await supabase
        .from("defects")
        .select("id, title, reported_at, sla_days")
        .eq("project_id", projectId)
        .not("reported_at", "is", null);

      if (defects) {
        for (const d of defects) {
          if (d.sla_days && d.reported_at) {
            const deadline = new Date(d.reported_at);
            deadline.setDate(deadline.getDate() + d.sla_days);
            events.push({
              uid: `defect-sla-${d.id}@vedawell`,
              title: `Defect SLA Deadline: ${d.title || "Defect"}`,
              description: `SLA deadline for defect rectification (${d.sla_days} days)`,
              startDate: deadline,
              location,
            });
          }
        }
      }
    }

    const icsContent = generateICS(events);

    return new Response(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="guardian-${project.name.replace(/\s+/g, "-")}.ics"`,
      },
    });
  } catch (err) {
    console.error("[calendar-export] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
