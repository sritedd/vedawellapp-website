"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Call at the top of every authenticated Guardian server component to record last activity */
export async function touchLastSeen(userId: string) {
    const supabase = await createClient();
    await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", userId);
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();

    // Clear dev_mode cookie if it exists
    const cookieStore = await cookies();
    cookieStore.delete("dev_mode");

    redirect("/guardian/login");
}
