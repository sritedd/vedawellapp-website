import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";

/**
 * PWA manifest icon (192×192). Generated at request time as a branded
 * VedaWell mark — matches the OG image palette so a user who installs the PWA
 * sees the same identity on the home screen as they do on social shares.
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
                        fontSize: "128px",
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
        { width: 192, height: 192 }
    );
}
