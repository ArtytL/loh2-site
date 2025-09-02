// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  // เอา StrictMode ออกชั่วคราวเพื่อตัด side-effect ซ้ำ
  <App />
);
