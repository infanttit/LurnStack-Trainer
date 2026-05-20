import { AuthProvider } from "../../auth";

export default function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
