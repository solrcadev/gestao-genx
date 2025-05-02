
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

import Layout from "@/components/layout/Layout";
import ErrorPage from "@/pages/ErrorPage";
import LoadingPage from "@/pages/LoadingPage";
import HomePage from "@/pages/HomePage";
import Treinos from "@/pages/Treinos";
import TreinoDoDia from "@/pages/TreinoDoDia";
import AthleteDetails from "@/pages/AthleteDetails";
import AvaliacaoQualitativa from "@/pages/AvaliacaoQualitativa";
import Atletas from "@/pages/Atletas";
import Performance from "@/pages/Performance";
import Presenca from "@/pages/Presenca";

// Lazy loading para rotas menos comuns
const Relatorios = lazy(() => import("@/pages/Relatorios"));
const Exercicios = lazy(() => import("@/pages/Exercicios"));
const Macrociclos = lazy(() => import("@/pages/Macrociclos"));
const MeuPerfil = lazy(() => import("@/pages/MeuPerfil"));
const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
const AtletaPerformance = lazy(() => import("@/pages/AtletaPerformance"));

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "treinos", element: <Treinos /> },
      { path: "treino-do-dia", element: <TreinoDoDia /> },
      { path: "treino-do-dia/:id", element: <TreinoDoDia /> },
      { path: "presenca", element: <Presenca /> },
      { path: "presenca/:treinoDoDiaId", element: <Presenca /> },
      { path: "atletas", element: <Atletas /> },
      { path: "atleta/:id", element: <AthleteDetails /> },
      { path: "atletas/:id", element: <Navigate to="/atleta/:id" replace /> },
      { path: "aluno/:id/performance", element: 
        <Suspense fallback={<LoadingPage />}>
          <AtletaPerformance />
        </Suspense> 
      },
      { path: "desempenho", element: <Navigate to="/performance" replace /> },
      { path: "performance", element: <Performance /> },
      { path: "avaliacao-qualitativa", element: <AvaliacaoQualitativa /> },
      { path: "relatorios", element: 
        <Suspense fallback={<LoadingPage />}>
          <Relatorios />
        </Suspense> 
      },
      { path: "exercicios", element: 
        <Suspense fallback={<LoadingPage />}>
          <Exercicios />
        </Suspense> 
      },
      { path: "macrociclos", element: 
        <Suspense fallback={<LoadingPage />}>
          <Macrociclos />
        </Suspense> 
      },
      { path: "meu-perfil", element: 
        <Suspense fallback={<LoadingPage />}>
          <MeuPerfil />
        </Suspense> 
      },
      { path: "configuracoes", element: 
        <Suspense fallback={<LoadingPage />}>
          <Configuracoes />
        </Suspense> 
      },
    ],
  },
]);
