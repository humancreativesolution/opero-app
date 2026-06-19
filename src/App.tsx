import { Toaster } from "@/components/ui/sonner";
import routes from "@/routes";
import { useRoutes } from "react-router-dom";

function App() {
  const element = useRoutes(routes);

  return (
    <>
      {element}
      <Toaster richColors />
    </>
  );
}

export default App;
