
import { Menu } from "lucide-react";

const More = () => {
  return (
    <div className="mobile-container">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Menu className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Mais</h1>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center py-12">
        <Menu className="h-16 w-16 text-muted" />
        <h2 className="mt-6 text-xl font-semibold">Funcionalidade em breve</h2>
        <p className="mt-2 text-center text-muted-foreground max-w-xs">
          Configurações adicionais e outras funcionalidades estarão disponíveis em breve.
        </p>
      </div>
    </div>
  );
};

export default More;
