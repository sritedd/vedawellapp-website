import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";

/**
 * PWA manifest icon (512×512). Larger maskable variant — Android + Chrome use
 * this for splash screens and adaptive-icon masking. The inner "V" sits well
 * inside the 80% safe zone so it isn't clipped under circular or squircle masks.
 */
export async function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #0D6E6E 0%, #14B8A6 100%)",
                    fontFamily: "system-ui, sans-serif",
                }}
            >
                <div
                    style={{
                        fontSize: "340px",
                        fontWeight: 800,
                        color: "white",
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                    }}
                >
                    V
                </div>
            </div>
        ),
        { width: 512, height: 512 }
    );
}
