import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HomeOwner Guardian — Protect Your Build";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    background: "linear-gradient(135deg, #0f172a 0%, #1a1a2e 50%, #0f172a 100%)",
                    padding: "60px",
                    fontFamily: "system-ui, sans-serif",
                }}
            >
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" }}>
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "14px",
                            background: "linear-gradient(135deg, #0D6E6E, #14B8A6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "28px",
                            color: "white",
                            fontWeight: 700,
                        }}
                    >
                        V
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#94a3b8" }}>
                        VedaWell <span style={{ color: "#2DD4BF" }}>Guardian</span>
                    </div>
                </div>

                {/* Title */}
                <div
                    style={{
                        fontSize: "52px",
                        fontWeight: 800,
                        color: "white",
                        lineHeight: 1.15,
                        marginBottom: "20px",
                        maxWidth: "800px",
                    }}
                >
                    Your Builder Won&apos;t Tell You
                    <br />
                    <span style={{ color: "#EF4444" }}>What They&apos;re Hiding</span>
                </div>

                {/* Subtitle */}
                <div style={{ fontSize: "22px", color: "#94a3b8", lineHeight: 1.5, maxWidth: "700px" }}>
                    Track defects, monitor inspections, and protect your $500K+ investment. Australia&apos;s #1 home construction watchdog.
                </div>

                {/* Bottom stats */}
                <div style={{ display: "flex", gap: "32px", marginTop: "auto" }}>
                    {[
                        { value: "$40K+", label: "Avg defect cost" },
                        { value: "7", label: "Build stages tracked" },
                        { value: "$14.99", label: "Per month" },
                    ].map((stat) => (
                        <div key={stat.label} style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ fontSize: "32px", fontWeight: 800, color: "#2DD4BF" }}>{stat.value}</div>
                            <div style={{ fontSize: "14px", color: "#64748b" }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        ),
        { ...size }
    );
}
