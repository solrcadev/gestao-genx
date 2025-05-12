import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface HistoricoButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

const HistoricoButton: React.FC<HistoricoButtonProps> = ({ onClick, isLoading }) => {
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8"
      onClick={onClick}
      disabled={isLoading}
      title="Ver histórico detalhado"
    >
      <Eye className="h-4 w-4" />
    </Button>
  );
};

export default HistoricoButton; 