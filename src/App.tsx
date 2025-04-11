
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Athletes from "./pages/Athletes";
import Trainings from "./pages/Trainings";
import Performance from "./pages/Performance";
import More from "./pages/More";
import NotFound from "./pages/NotFound";
import Exercises from "./pages/Exercises";
import TrainingAssembly from "./pages/TrainingAssembly";
import TreinoDoDia from "./pages/TreinoDosDia";
import BottomNavbar from "./components/BottomNavbar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="bg-background min-h-screen">
          <Routes>
            <Route path="/" element={<Athletes />} />
            <Route path="/treinos" element={<Trainings />} />
            <Route path="/exercicios" element={<Exercises />} />
            <Route path="/montar-treino" element={<TrainingAssembly />} />
            <Route path="/desempenho" element={<Performance />} />
            <Route path="/mais" element={<More />} />
            <Route path="/treino-do-dia/:id" element={<TreinoDoDia />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNavbar />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
