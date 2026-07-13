import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getToken } from "./lib/auth";

document.documentElement.classList.add("dark");
document.documentElement.setAttribute("dir", "rtl");
document.documentElement.setAttribute("lang", "fa");

const saved = localStorage.getItem("nadraan_theme");
if (saved === "light") {
  document.documentElement.classList.remove("dark");
} else {
  document.documentElement.classList.add("dark");
}

setAuthTokenGetter(() => getToken());

createRoot(document.getElementById("root")!).render(<App />);
