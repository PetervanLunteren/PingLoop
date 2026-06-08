import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles.css";

// Keep the offline cache up to date. The app stays usable while it updates.
registerSW({ immediate: true });

const root = document.getElementById("root");
if (!root) throw new Error("missing #root element");

// No StrictMode: it double-invokes effects in development, which would run the
// scheduling loop twice and fire duplicate pings while testing.
createRoot(root).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
