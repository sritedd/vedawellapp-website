import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Orphaned storage sweep.
 *
 * Deleting a `projects` row does NOT delete its uploaded files. The app's own
 * paths handle this correctly — `deleteProject()` and `/api/guardian/delete-account`
 * both clear storage explicitly — but anything that removes rows OUTSIDE those
 * paths (an admin action, a bulk tool, a failed migration, test tooling using the
 * service role) leaves objects behind with no owning project.
 *
 * Since schema_v49 made the buckets private those orphans are no longer publicly
 * fetchable, so this is hygiene rather than an exposure fix — but they still
 * accrue storage cost forever and muddy any audit of what data we hold.
 *
 * SAFETY: only deletes objects whose top-level folder is a project id that no
 * longer exists. A folder whose name isn't a UUID is left alone rather than
 * guessed at — an unrecognised layout is a reason to stop, not to delete.
 *
 * POST /api/cron/storage-sweep     Authorization: Bearer $CRON_SECRET
 * Add `?dryRun=1` to report without deleting.
 */

const BUCKETS = ["evidence", "documents", "certificates"] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Cap per run so a huge backlog can't blow the function timeout. */
const MAX_DELETIONS_PER_RUN = 500;

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Fail-closed: no secret configured means nobody gets in.
    if (!cronSecret?.trim() || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );

    // Live project ids. If this read fails we must NOT proceed — an empty set
    // would make every object look orphaned and wipe the buckets.
    const { data: projects, error: projErr } = await supabase.from("projects").select("id");
    if (projErr) {
        console.error("[storage-sweep] Could not list projects — aborting:", projErr.message);
        return NextResponse.json(
            { error: "Could not read projects; refusing to sweep." },
            { status: 503 }
        );
    }
    const live = new Set((projects || []).map((p: { id: string }) => p.id));

    const report: Record<string, { orphanFolders: string[]; deleted: number; skipped: string[] }> = {};
    let totalDeleted = 0;

    for (const bucket of BUCKETS) {
        const entry = { orphanFolders: [] as string[], deleted: 0, skipped: [] as string[] };
        report[bucket] = entry;

        const { data: roots, error: listErr } = await supabase.storage.from(bucket).list("", { limit: 1000 });
        if (listErr) {
            console.error(`[storage-sweep] list ${bucket} failed:`, listErr.message);
            continue;
        }

        for (const root of roots || []) {
            if (!UUID_RE.test(root.name)) {
                // Unrecognised top-level folder — never guess.
                entry.skipped.push(root.name);
                continue;
            }
            if (live.has(root.name)) continue;

            entry.orphanFolders.push(root.name);
            if (totalDeleted >= MAX_DELETIONS_PER_RUN) continue;

            // Enumerate one level down (project/<sub>/<file>) plus files at root.
            const paths: string[] = [];
            const { data: lvl1 } = await supabase.storage.from(bucket).list(root.name, { limit: 1000 });
            for (const item of lvl1 || []) {
                if (item.id) {
                    paths.push(`${root.name}/${item.name}`);
                } else {
                    const { data: lvl2 } = await supabase.storage
                        .from(bucket).list(`${root.name}/${item.name}`, { limit: 1000 });
                    for (const f of lvl2 || []) paths.push(`${root.name}/${item.name}/${f.name}`);
                }
            }

            const room = MAX_DELETIONS_PER_RUN - totalDeleted;
            const batch = paths.slice(0, room);
            if (batch.length === 0) continue;

            if (!dryRun) {
                const { error: rmErr } = await supabase.storage.from(bucket).remove(batch);
                if (rmErr) {
                    console.error(`[storage-sweep] remove in ${bucket} failed:`, rmErr.message);
                    continue;
                }
            }
            entry.deleted += batch.length;
            totalDeleted += batch.length;
        }
    }

    console.log(`[storage-sweep] ${dryRun ? "DRY RUN — " : ""}removed ${totalDeleted} orphaned object(s)`);

    return NextResponse.json({
        success: true,
        dryRun,
        liveProjects: live.size,
        totalDeleted,
        cappedAt: totalDeleted >= MAX_DELETIONS_PER_RUN ? MAX_DELETIONS_PER_RUN : null,
        report,
        timestamp: new Date().toISOString(),
    });
}
