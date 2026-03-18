import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VedaWell — 90+ Free Online Tools";
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
                    background: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)",
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
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>
                        Veda<span style={{ color: "#0D6E6E" }}>Well</span> Tools
                    </div>
                </div>

                {/* Title */}
                <div
                    style={{
                        fontSize: "48px",
                        fontWeight: 800,
                        color: "#0f172a",
                        lineHeight: 1.15,
                        marginBottom: "20px",
                    }}
                >
                    90+ Free Online Tools
                </div>

                {/* Subtitle */}
                <div style={{ fontSize: "22px", color: "#475569", lineHeight: 1.5, maxWidth: "700px" }}>
                    Calculators, converters, generators, and more. 100% browser-based — no downloads, no sign-ups, no tracking.
                </div>

                {/* Tool categories */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "auto" }}>
                    {["Calculators", "Converters", "Generators", "Dev Tools", "Health", "Finance"].map((cat) => (
                        <div
                            key={cat}
                            style={{
                                padding: "10px 20px",
                                borderRadius: "999px",
                                background: "rgba(13, 110, 110, 0.1)",
                                border: "1px solid rgba(13, 110, 110, 0.2)",
                                color: "#0D6E6E",
                                fontSize: "16px",
                                fontWeight: 600,
                            }}
                        >
                            {cat}
                        </div>
                    ))}
                </div>
            </div>
        ),
        { ...size }
    );
}
