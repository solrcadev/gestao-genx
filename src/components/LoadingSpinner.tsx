
import { Loader2 } from "lucide-react";

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
    </div>
  );
};

export default LoadingSpinner;
