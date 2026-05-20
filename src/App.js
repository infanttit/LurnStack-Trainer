import { BrowserRouter } from "react-router-dom";
import AppRouter from "./app/router/router";
import AppProviders from "./app/providers/AppProviders";

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AppProviders>
  );
}
