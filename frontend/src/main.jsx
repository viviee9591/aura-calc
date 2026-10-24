import { Component, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// shows the real error on the page instead of a blank screen
function showError(text) {
  const box = document.createElement("pre");
  box.style.cssText =
    "position:fixed;inset:0;z-index:99999;margin:0;padding:24px;overflow:auto;" +
    "background:#fff;color:#c00;font:14px/1.5 monospace;white-space:pre-wrap;";
  box.textContent = text;
  document.body.appendChild(box);
}

window.addEventListener("error", (e) =>
  showError("ERROR:\n" + (e.error?.stack || e.message))
);
window.addEventListener("unhandledrejection", (e) =>
  showError("PROMISE ERROR:\n" + (e.reason?.stack || e.reason))
);

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <pre style={{ padding: 24, color: "#c00", whiteSpace: "pre-wrap" }}>
          {"ERROR:\n" + (this.state.error.stack || this.state.error)}
        </pre>
      );
    }
    return this.props.children;
  }
}

// App is loaded here (not at the top) so a broken import is caught and shown
import("./App.jsx")
  .then(({ default: App }) => {
    createRoot(document.getElementById("root")).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  })
  .catch((err) => showError("LOAD ERROR:\n" + (err?.stack || err)));