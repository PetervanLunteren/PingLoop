import { StoreProvider } from "./state";
import { PermissionSetup } from "./components/PermissionSetup";
import { Timer } from "./components/Timer";

const logo = `${import.meta.env.BASE_URL}pingloop-wide-v2.svg`;

export function App() {
  return (
    <StoreProvider>
      <div className="app">
        <header className="header">
          <img src={logo} alt="PingLoop" />
        </header>
        <main className="content">
          <PermissionSetup />
          <Timer />
        </main>
      </div>
    </StoreProvider>
  );
}
