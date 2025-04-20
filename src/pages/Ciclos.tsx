
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';
import { useDeviceInfo } from '@/hooks/use-mobile';

// This will be a placeholder component until the forms are created
const MacrocicloForm = () => (
  <div className="p-4 border rounded-md">
    <h3 className="font-medium mb-2">Formulário de Macrociclo</h3>
    <p className="text-muted-foreground text-sm">Implementação pendente</p>
  </div>
);

// This will be a placeholder component until the forms are created
const MesocicloForm = () => (
  <div className="p-4 border rounded-md">
    <h3 className="font-medium mb-2">Formulário de Mesociclo</h3>
    <p className="text-muted-foreground text-sm">Implementação pendente</p>
  </div>
);

// This will be a placeholder component until the forms are created
const MicrocicloForm = () => (
  <div className="p-4 border rounded-md">
    <h3 className="font-medium mb-2">Formulário de Microciclo</h3>
    <p className="text-muted-foreground text-sm">Implementação pendente</p>
  </div>
);

// Export the main component as default
const Ciclos = () => {
  const [activeTab, setActiveTab] = useState('macrociclos');
  const { isMobile } = useDeviceInfo();

  return (
    <div className="mobile-container pb-20">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Ciclos de Treinamento</h1>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="macrociclos">Macrociclos</TabsTrigger>
          <TabsTrigger value="mesociclos">Mesociclos</TabsTrigger>
          <TabsTrigger value="microciclos">Microciclos</TabsTrigger>
        </TabsList>

        <TabsContent value="macrociclos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gerenciar Macrociclos</CardTitle>
              <CardDescription>
                Planejamento de longo prazo (meses/anos)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Novo Macrociclo
              </Button>
              <MacrocicloForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mesociclos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gerenciar Mesociclos</CardTitle>
              <CardDescription>
                Planejamento de médio prazo (semanas)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Novo Mesociclo
              </Button>
              <MesocicloForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="microciclos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gerenciar Microciclos</CardTitle>
              <CardDescription>
                Planejamento de curto prazo (dias/sessões)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Novo Microciclo
              </Button>
              <MicrocicloForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Ciclos;
