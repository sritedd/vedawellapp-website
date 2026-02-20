"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();

    // Clear dev_mode cookie if it exists
    const cookieStore = await cookies();
    cookieStore.delete("dev_mode");

    redirect("/guardian/login");
}
