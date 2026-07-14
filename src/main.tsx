import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import App from "./App";
import { Loupe } from "./components/Loupe";
import "./index.css";

// The loupe window loads the same bundle; route by window label
const isLoupe = getCurrentWindow().label === "loupe";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{isLoupe ? <Loupe /> : <App />}</React.StrictMode>
);
