import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0A0A",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          border: "2px solid #F5C842",
        }}
      >
        <span style={{ color: "#F5C842", fontSize: 18, fontWeight: "bold", fontFamily: "monospace" }}>
          K
        </span>
      </div>
    ),
    { ...size }
  );
}
