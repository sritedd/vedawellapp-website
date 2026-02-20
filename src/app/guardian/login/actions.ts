"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAsDevUser() {
    // SECURITY: Only allow dev login in development environment
    if (process.env.NODE_ENV === "production") {
        throw new Error("Dev login is not available in production");
    }

    const cookieStore = await cookies();
    cookieStore.set("dev_mode", "true", {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 86400, // 24 hours
    });
    redirect("/guardian/dashboard");
}

export async function logoutDevUser() {
    // SECURITY: Only allow dev logout in development environment
    if (process.env.NODE_ENV === "production") {
        throw new Error("Dev logout is not available in production");
    }

    const cookieStore = await cookies();
    cookieStore.delete("dev_mode");
    redirect("/guardian/login");
}
