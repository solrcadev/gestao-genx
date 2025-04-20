
import React from 'react';
import { Card, Typography, Tabs, Button, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PageTitle from '@/components/PageTitle';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

type CicloType = 'macrociclo' | 'mesociclo' | 'microciclo';

const Ciclos: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<string>('macrociclos');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [showForm, setShowForm] = React.useState<boolean>(false);
  const [currentCicloType, setCurrentCicloType] = React.useState<CicloType>('macrociclo');

  const handleChangeTab = (activeKey: string) => {
    setActiveTab(activeKey);
    setShowForm(false);
    
    if (activeKey === 'macrociclos') {
      setCurrentCicloType('macrociclo');
    } else if (activeKey === 'mesociclos') {
      setCurrentCicloType('mesociclo');
    } else if (activeKey === 'microciclos') {
      setCurrentCicloType('microciclo');
    }
  };

  const handleAddCiclo = () => {
    setShowForm(true);
  };

  return (
    <div className="p-4">
      <PageTitle title="Periodização" />
      
      <Card className="mb-4">
        <Text>
          Gerencie sua periodização de treinamentos com macrociclos, mesociclos e microciclos, 
          organizando de forma estruturada todo o planejamento da temporada.
        </Text>
      </Card>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={handleChangeTab}
        className="mt-4"
      >
        <TabPane tab="Macrociclos" key="macrociclos">
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddCiclo}
            className="mb-4"
          >
            Adicionar Macrociclo
          </Button>

          {loading ? (
            <div className="flex justify-center">
              <Spin />
            </div>
          ) : (
            <div>
              {showForm ? (
                <div className="mb-4">
                  {/* Form will go here */}
                  <Card title="Novo Macrociclo">
                    <p>Formulário de criação de macrociclo em desenvolvimento</p>
                  </Card>
                </div>
              ) : (
                <Card>
                  <Text>Nenhum macrociclo cadastrado.</Text>
                </Card>
              )}
            </div>
          )}
        </TabPane>
        
        <TabPane tab="Mesociclos" key="mesociclos">
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddCiclo}
            className="mb-4"
          >
            Adicionar Mesociclo
          </Button>
          
          <Card>
            <Text>Nenhum mesociclo cadastrado.</Text>
          </Card>
        </TabPane>
        
        <TabPane tab="Microciclos" key="microciclos">
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddCiclo}
            className="mb-4"
          >
            Adicionar Microciclo
          </Button>
          
          <Card>
            <Text>Nenhum microciclo cadastrado.</Text>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

// Add default export
export default Ciclos;
