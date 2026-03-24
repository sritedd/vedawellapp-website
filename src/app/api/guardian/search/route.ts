import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

interface SearchResult {
  type: string;
  id: string;
  title: string;
  snippet: string;
  projectId: string;
  projectName?: string;
}

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
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim();
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Sanitize: remove special chars for ilike safety
    const searchTerm = `%${query.replace(/[%_]/g, "")}%`;

    // Get user's projects
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .eq("user_id", user.id);

    if (!projects || projects.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const projectIds = projects.map((p: { id: string }) => p.id);
    const projectMap = new Map(projects.map((p: { id: string; name: string }) => [p.id, p.name]));

    const results: SearchResult[] = [];

    // Search across multiple tables in parallel
    const [defectsRes, variationsRes, communicationsRes, documentsRes, siteVisitsRes] = await Promise.all([
      supabase
        .from("defects")
        .select("id, project_id, title, description, location")
        .in("project_id", projectIds)
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},location.ilike.${searchTerm}`)
        .limit(10),
      supabase
        .from("variations")
        .select("id, project_id, title, description")
        .in("project_id", projectIds)
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(10),
      supabase
        .from("communication_log")
        .select("id, project_id, summary, details")
        .in("project_id", projectIds)
        .or(`summary.ilike.${searchTerm},details.ilike.${searchTerm}`)
        .limit(10),
      supabase
        .from("documents")
        .select("id, project_id, name, type")
        .in("project_id", projectIds)
        .or(`name.ilike.${searchTerm},type.ilike.${searchTerm}`)
        .limit(10),
      supabase
        .from("site_visits")
        .select("id, project_id, notes")
        .in("project_id", projectIds)
        .ilike("notes", searchTerm)
        .limit(10),
    ]);

    // Map results
    for (const d of defectsRes.data || []) {
      results.push({
        type: "defect",
        id: d.id,
        title: d.title,
        snippet: d.description?.slice(0, 120) || d.location || "",
        projectId: d.project_id,
        projectName: projectMap.get(d.project_id),
      });
    }

    for (const v of variationsRes.data || []) {
      results.push({
        type: "variation",
        id: v.id,
        title: v.title,
        snippet: v.description?.slice(0, 120) || "",
        projectId: v.project_id,
        projectName: projectMap.get(v.project_id),
      });
    }

    for (const c of communicationsRes.data || []) {
      results.push({
        type: "communication",
        id: c.id,
        title: c.summary || "Communication",
        snippet: c.details?.slice(0, 120) || "",
        projectId: c.project_id,
        projectName: projectMap.get(c.project_id),
      });
    }

    for (const doc of documentsRes.data || []) {
      results.push({
        type: "document",
        id: doc.id,
        title: doc.name,
        snippet: doc.type || "",
        projectId: doc.project_id,
        projectName: projectMap.get(doc.project_id),
      });
    }

    for (const sv of siteVisitsRes.data || []) {
      results.push({
        type: "site_visit",
        id: sv.id,
        title: "Site Visit",
        snippet: sv.notes?.slice(0, 120) || "",
        projectId: sv.project_id,
        projectName: projectMap.get(sv.project_id),
      });
    }

    return NextResponse.json({ results: results.slice(0, 30) });
  } catch (err) {
    console.error("[search] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
