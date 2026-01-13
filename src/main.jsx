import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import "./tailwind.css";
import { AlertProvider } from "./context/AlertContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { ThemeProvider } from "./context/ThemeContext";

// 🆕 ADD THIS:
import { Provider } from "react-redux";
import { store } from "./redux/store";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>   {/* <-- NEW */}
      <BrowserRouter>
        <AlertProvider>
          <ConfirmProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </ConfirmProvider>
        </AlertProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
