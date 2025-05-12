import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, FileText, ExternalLink } from 'lucide-react';

const DocumentacaoLink = () => {
  return (
    <Card className="bg-primary-foreground border-dashed">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <span className="font-medium">Precisa de ajuda com o sistema de presenças?</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              asChild
            >
              <a href="/app/docs/attendance-system-guide.md" target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" />
                Ver Documentação
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentacaoLink; 