import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // DOIT ÊTRE ICI
import "./theme/variables.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
