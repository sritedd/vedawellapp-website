"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAsDevUser() {
    const cookieStore = await cookies();
    // Set a cookie to indicate we are in Dev/Mock mode
    cookieStore.set("dev_mode", "true", { path: "/" });
    redirect("/guardian/dashboard");
}

export async function logoutDevUser() {
    const cookieStore = await cookies();
    cookieStore.delete("dev_mode");
    redirect("/guardian/login");
}
