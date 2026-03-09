import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const type = req.nextUrl.searchParams.get("type");

    if (type === "users") {
        const { data } = await supabase
            .from("profiles")
            .select("email, full_name, phone, role, subscription_tier, is_admin, trial_ends_at, last_seen_at, created_at")
            .order("created_at", { ascending: false });

        const csv = toCsv(data ?? [], ["email", "full_name", "phone", "role", "subscription_tier", "is_admin", "trial_ends_at", "last_seen_at", "created_at"]);
        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="vedawell-users-${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        });
    }

    if (type === "subscribers") {
        const { data } = await supabase
            .from("email_subscribers")
            .select("email, source, status, created_at")
            .order("created_at", { ascending: false });

        const csv = toCsv(data ?? [], ["email", "source", "status", "created_at"]);
        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="vedawell-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        });
    }

    return NextResponse.json({ error: "Invalid type. Use ?type=users or ?type=subscribers" }, { status: 400 });
}

function toCsv(rows: Record<string, any>[], columns: string[]): string {
    const header = columns.join(",");
    const lines = rows.map(row =>
        columns.map(col => {
            const val = row[col] ?? "";
            const str = String(val);
            return str.includes(",") || str.includes('"') || str.includes("\n")
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        }).join(",")
    );
    return [header, ...lines].join("\n");
}
