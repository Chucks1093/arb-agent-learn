export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050505",
        color: "#ffffff",
        fontFamily: "system-ui, sans-serif",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "680px",
          border: "1px solid rgba(198, 255, 145, 0.18)",
          borderRadius: "24px",
          background: "#0d0d0d",
          padding: "32px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "#c6ff91",
          }}
        >
          Server Status
        </p>
        <h1 style={{ margin: "12px 0 8px", fontSize: "40px", lineHeight: 1 }}>
          arb-agent-learn server
        </h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.7)" }}>
          The Next.js backend is running.
        </p>

        <div
          style={{
            marginTop: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px",
            borderRadius: "16px",
            background: "rgba(198, 255, 145, 0.08)",
            border: "1px solid rgba(198, 255, 145, 0.14)",
          }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "999px",
              background: "#c6ff91",
              display: "inline-block",
            }}
          />
          <span>status: online</span>
        </div>

        <p style={{ marginTop: "20px", marginBottom: 0, color: "rgba(255,255,255,0.65)" }}>
          Health endpoint:
        </p>
        <code
          style={{
            display: "inline-block",
            marginTop: "8px",
            padding: "10px 12px",
            borderRadius: "12px",
            background: "#141414",
            color: "#c6ff91",
          }}
        >
          /api/health
        </code>
      </section>
    </main>
  );
}
