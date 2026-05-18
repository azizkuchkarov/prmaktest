import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS / Safari uchun katta ikon. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2563eb 0%, #5b21b6 100%)",
          color: "#ffffff",
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: "-0.06em",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          borderRadius: 36,
        }}
      >
        PM
      </div>
    ),
    { ...size },
  );
}
