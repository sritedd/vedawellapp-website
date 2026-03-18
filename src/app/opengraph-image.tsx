import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VedaWell — 90+ Free Tools & HomeOwner Guardian";
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
                    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
                    padding: "60px",
                    fontFamily: "system-ui, sans-serif",
                }}
            >
                {/* Top bar */}
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
                    <div style={{ fontSize: "28px", fontWeight: 700, color: "white" }}>
                        Veda<span style={{ color: "#2DD4BF" }}>Well</span>
                    </div>
                </div>

                {/* Main title */}
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
                    90+ Free Tools, Games &
                    <br />
                    <span style={{ color: "#2DD4BF" }}>HomeOwner Guardian</span>
                </div>

                {/* Subtitle */}
                <div style={{ fontSize: "22px", color: "#94a3b8", lineHeight: 1.5, maxWidth: "700px" }}>
                    Free browser-based productivity tools, 19 games, and Australia&apos;s #1 home construction tracker. No downloads, no sign-ups.
                </div>

                {/* Bottom badges */}
                <div style={{ display: "flex", gap: "16px", marginTop: "auto" }}>
                    {["98+ Tools", "19 Games", "Guardian Pro", "100% Free"].map((badge) => (
                        <div
                            key={badge}
                            style={{
                                padding: "10px 20px",
                                borderRadius: "999px",
                                background: "rgba(45, 212, 191, 0.1)",
                                border: "1px solid rgba(45, 212, 191, 0.3)",
                                color: "#2DD4BF",
                                fontSize: "16px",
                                fontWeight: 600,
                            }}
                        >
                            {badge}
                        </div>
                    ))}
                </div>
            </div>
        ),
        { ...size }
    );
}
