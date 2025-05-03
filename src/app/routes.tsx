
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

// Create simple placeholder components for missing pages
const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <header className="bg-primary text-white p-4">
      <h1 className="text-xl font-bold">GenX Painel</h1>
    </header>
    <main className="flex-1">
      {children}
    </main>
    <footer className="bg-gray-100 p-4 text-center text-sm text-gray-600">
      GenX Panel © {new Date().getFullYear()}
    </footer>
  </div>
);

const ErrorPage = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center p-6">
      <h1 className="text-2xl font-bold mb-2">Erro</h1>
      <p>Ocorreu um erro ao carregar esta página.</p>
    </div>
  </div>
);

const LoadingPage = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center p-6">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
      <p>Carregando...</p>
    </div>
  </div>
);

const HomePage = () => (
  <div className="container mx-auto p-6">
    <h1 className="text-2xl font-bold mb-4">Bem-vindo ao GenX Painel</h1>
    <p>Selecione uma opção no menu para começar.</p>
  </div>
);

// Import actual implemented pages
import Presenca from "@/pages/Presenca";

// Lazy-loaded pages
const Treinos = lazy(() => import("@/pages/Treinos"));
const TreinoDoDia = lazy(() => import("@/pages/TreinoDoDia"));
const Atletas = lazy(() => import("@/pages/Atletas"));
const AthleteDetails = lazy(() => import("@/pages/AthleteDetails"));

// Define routes
export const routes = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { 
        path: "treinos", 
        element: (
          <Suspense fallback={<LoadingPage />}>
            <Treinos />
          </Suspense>
        ) 
      },
      { 
        path: "treino-do-dia", 
        element: (
          <Suspense fallback={<LoadingPage />}>
            <TreinoDoDia />
          </Suspense>
        ) 
      },
      { 
        path: "treino-do-dia/:id", 
        element: (
          <Suspense fallback={<LoadingPage />}>
            <TreinoDoDia />
          </Suspense>
        ) 
      },
      { path: "presenca", element: <Presenca /> },
      { path: "presenca/:treinoDoDiaId", element: <Presenca /> },
      { 
        path: "atletas", 
        element: (
          <Suspense fallback={<LoadingPage />}>
            <Atletas />
          </Suspense>
        ) 
      },
      { 
        path: "atleta/:id", 
        element: (
          <Suspense fallback={<LoadingPage />}>
            <AthleteDetails />
          </Suspense>
        ) 
      },
      { path: "atletas/:id", element: <Navigate to="/atleta/:id" replace /> },
    ],
  },
]);
