import { config } from "../config";

export default function ConfigDebug() {
  const handleTestRedirect = () => {
    console.log("Config:", config);
    console.log(
      "About to redirect to:",
      config.authBase + config.authorizePath,
    );

    if (!config.clientId) {
      alert("❌ VITE_SCALEKIT_CLIENT_ID is missing! Check your .env file.");
      return;
    }

    // Test manual redirect
    const testUrl = new URL(config.authorizePath, config.authBase);
    testUrl.searchParams.set("response_type", "code");
    testUrl.searchParams.set("client_id", config.clientId);
    testUrl.searchParams.set("redirect_uri", config.redirectUri);
    testUrl.searchParams.set("scope", "openid profile offline_access");
    testUrl.searchParams.set("state", "test-state");

    console.log("Test ScaleKit URL:", testUrl.toString());
    window.location.href = testUrl.toString();
  };

  return (
    <div style={{ padding: 20, border: "1px solid #ccc", margin: 20 }}>
      <h3>🔧 ScaleKit Configuration Debug</h3>
      <div style={{ marginBottom: 10 }}>
        <strong>Client ID:</strong> {config.clientId || "❌ MISSING"}
      </div>
      <div style={{ marginBottom: 10 }}>
        <strong>Auth Base:</strong> {config.authBase}
      </div>
      <div style={{ marginBottom: 10 }}>
        <strong>Redirect URI:</strong> {config.redirectUri}
      </div>
      <div style={{ marginBottom: 10 }}>
        <strong>Full Auth URL:</strong> {config.authBase + config.authorizePath}
      </div>
      <button
        onClick={handleTestRedirect}
        style={{
          background: config.clientId ? "#28a745" : "#dc3545",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {config.clientId ? "🚀 Test ScaleKit Redirect" : "❌ Fix Config First"}
      </button>
    </div>
  );
}
