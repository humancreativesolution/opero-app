import { Toaster } from "@/components/ui/sonner";
import { AuthSessionGuard } from "@/features/auth/components/auth-session-guard.component";
import routes from "@/routes";
import { useRoutes } from "react-router-dom";

function App() {
  const element = useRoutes(routes);

  return (
    <>
      <AuthSessionGuard />
      {element}
      <Toaster richColors />
    </>
  );
}

export default App;
