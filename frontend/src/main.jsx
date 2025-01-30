import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import CaptionPage from "./routes/CaptionPage.jsx";
import { HashRouter, Routes, Route } from "react-router";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="caption" element={<CaptionPage />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
);
