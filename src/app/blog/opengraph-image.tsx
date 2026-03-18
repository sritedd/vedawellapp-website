import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VedaWell Blog — Home Building Tips & Guides";
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
                    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                    padding: "60px",
                    fontFamily: "system-ui, sans-serif",
                }}
            >
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
                        VedaWell <span style={{ color: "#2DD4BF" }}>Blog</span>
                    </div>
                </div>

                <div style={{ fontSize: "48px", fontWeight: 800, color: "white", lineHeight: 1.15, marginBottom: "20px" }}>
                    Home Building Tips,
                    <br />
                    <span style={{ color: "#2DD4BF" }}>Guides & Insights</span>
                </div>

                <div style={{ fontSize: "22px", color: "#94a3b8", lineHeight: 1.5, maxWidth: "700px" }}>
                    Expert advice on Australian home construction, defect prevention, and protecting your building investment.
                </div>
            </div>
        ),
        { ...size }
    );
}
