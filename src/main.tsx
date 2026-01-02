import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/reset.css";
import "./styles/typography.css";
import "./styles/dark.css";
import "./styles/light.css";
import "./styles/StartScreen.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
