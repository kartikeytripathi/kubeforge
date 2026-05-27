import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "KubeForge — Hands-on Kubernetes & EKS Learning";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0A0A",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          gap: 0,
        }}
      >
        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 8,
              border: "3px solid #F5C842",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#0A0A0A",
            }}
          >
            <span style={{ color: "#F5C842", fontSize: 36, fontWeight: "bold", fontFamily: "monospace" }}>
              K
            </span>
          </div>
          <span style={{ color: "#F5C842", fontSize: 72, fontWeight: "bold", fontFamily: "monospace" }}>
            KubeForge
          </span>
        </div>

        <div
          style={{
            color: "#E8E8E8",
            fontSize: 36,
            fontFamily: "monospace",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          Hands-on Kubernetes &amp; EKS Learning
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 48, marginTop: 8 }}>
          {["38 Labs", "Real kubectl", "Automated Verification", "Free Forever"].map((item) => (
            <div
              key={item}
              style={{
                color: "#9CA3AF",
                fontSize: 22,
                fontFamily: "monospace",
                borderLeft: "3px solid #F5C842",
                paddingLeft: 16,
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 80,
            color: "#9CA3AF",
            fontSize: 20,
            fontFamily: "monospace",
          }}
        >
          kubeforge.kartikeytripathi.in
        </div>
      </div>
    ),
    { ...size }
  );
}
