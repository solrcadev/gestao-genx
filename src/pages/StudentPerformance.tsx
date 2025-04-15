/**
 * StudentPerformance.tsx
 * 
 * Componente para exibição detalhada do desempenho de um atleta/estudante.
 * 
 * Características:
 * - Exibe indicadores gerais de desempenho (frequência, evolução, treinos concluídos)
 * - Mostra histórico de treinos e participação
 * - Exibe metas do atleta
 * - Permite registrar novas avaliações de desempenho por fundamento
 * - Visualização gráfica da evolução do atleta ao longo do tempo
 * 
 * O componente utiliza React com Ant Design para a interface e Recharts para
 * visualização de dados. Dados são obtidos através dos serviços de performance.
 */
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Progress, Table, Tag, Spin, Tabs, Form, Input, Select, InputNumber, Button as AntButton, message } from 'antd';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useParams, Link } from 'react-router-dom';
import { getAthletePerformance, getTrainingHistory, getStudentGoals, registrarAvaliacaoDesempenho, TrainingHistoryItem } from '../services/performanceService';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AthletePerformance } from '@/types';
import HistoricoTreinosAtleta from '@/components/performance/HistoricoTreinosAtleta';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
}

const { TabPane } = Tabs;

const StudentPerformance: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [performance, setPerformance] = useState<AthletePerformance | null>(null);
  const [history, setHistory] = useState<TrainingHistoryItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('1');
  const [avaliacaoForm] = Form.useForm();
  const [submittingAvaliacao, setSubmittingAvaliacao] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (studentId) {
        try {
          setLoading(true);
          const [performanceData, historyData, goalsData] = await Promise.all([
            getAthletePerformance(studentId),
            getTrainingHistory(studentId),
            getStudentGoals(studentId)
          ]);
          
          setPerformance(performanceData);
          setHistory(historyData);
          setGoals(goalsData);
        } catch (error) {
          console.error('Erro ao buscar dados de desempenho:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [studentId]);

  // Dados de evolução para gráfico baseados em avaliações ao longo do tempo
  const evolutionData = performance?.ultimasAvaliacoes?.map(avaliacao => {
    const total = avaliacao.acertos + avaliacao.erros;
    const percentualAcerto = total > 0 ? (avaliacao.acertos / total) * 100 : 0;
    
    return {
      data: avaliacao.data,
      percentual: percentualAcerto
    };
  }) || [];

  // Dados para o histograma de evolução mensal (simulados)
  const histogramData = [
    { mes: 'Jan', acertos: 65, erros: 35 },
    { mes: 'Fev', acertos: 70, erros: 30 },
    { mes: 'Mar', acertos: 75, erros: 25 },
    { mes: 'Abr', acertos: 80, erros: 20 },
    { mes: 'Mai', acertos: 78, erros: 22 },
    { mes: 'Jun', acertos: 85, erros: 15 },
  ];

  const historyColumns = [
    {
      title: 'Data',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Duração (min)',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'completed' ? 'green' : 
          status === 'missed' ? 'red' : 
          'orange'
        }>
          {status === 'completed' ? 'Concluído' : 
           status === 'missed' ? 'Ausente' : 
           'Incompleto'}
        </Tag>
      ),
    },
  ];

  const goalsColumns = [
    {
      title: 'Meta',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Descrição',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Data Alvo',
      dataIndex: 'targetDate',
      key: 'targetDate',
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
    },
    {
      title: 'Progresso',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress percent={progress} size="small" />
      ),
    },
  ];

  const handleSubmitAvaliacao = async (values: any) => {
    if (!studentId) return;
    
    try {
      setSubmittingAvaliacao(true);
      
      const avaliacaoData = {
        atleta_id: studentId,
        treino_id: values.treino_id || 'avaliacao_individual',
        fundamento: values.fundamento,
        acertos: values.acertos,
        erros: values.erros,
        timestamp: new Date().toISOString()
      };
      
      await registrarAvaliacaoDesempenho(avaliacaoData);
      
      message.success('Avaliação registrada com sucesso!');
      avaliacaoForm.resetFields();
      
      // Recarregar os dados de desempenho
      const performanceData = await getAthletePerformance(studentId);
      setPerformance(performanceData);
    } catch (error) {
      console.error('Erro ao registrar avaliação:', error);
      message.error('Erro ao registrar avaliação. Tente novamente.');
    } finally {
      setSubmittingAvaliacao(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="Carregando dados do atleta..." />
      </div>
    );
  }

  if (!performance) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Link to="/desempenho">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Desempenho
            </Button>
          </Link>
        </div>
        
        <Card title="Erro">
          <p>Não foi possível carregar os dados do atleta.</p>
          <Link to="/desempenho">
            <Button>Voltar para página de desempenho</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Link to="/desempenho">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Desempenho
          </Button>
        </Link>
      </div>
      
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: '#1890ff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '24px', 
            color: 'white',
            fontWeight: 'bold'
          }}>
            {performance.atleta.nome.substring(0, 2).toUpperCase()}
          </div>
        </Col>
        <Col>
          <h1 style={{ fontSize: '24px', margin: 0 }}>{performance.atleta.nome}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <Tag color="blue">{performance.atleta.posicao}</Tag>
            <Tag color="purple">{performance.atleta.time}</Tag>
            {performance.atleta.idade && <Tag color="cyan">Idade: {performance.atleta.idade} anos</Tag>}
            {performance.atleta.altura && <Tag color="green">Altura: {performance.atleta.altura}m</Tag>}
          </div>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card title="Frequência">
            <Progress
              type="circle"
              percent={performance.presenca.percentual}
              format={percent => `${Math.round(percent)}%`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Evolução">
            <Progress
              type="circle"
              percent={performance.avaliacoes.mediaNota}
              format={percent => `${Math.round(percent)}%`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Treinos Concluídos">
            <Progress
              type="circle"
              percent={(performance.presenca.presentes / Math.max(performance.presenca.total, 1)) * 100}
              format={() => `${performance.presenca.presentes}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Fundamentos Avaliados">
            <Progress
              type="circle"
              percent={Object.keys(performance.avaliacoes.porFundamento).length * 16.6}
              format={() => `${Object.keys(performance.avaliacoes.porFundamento).length}`}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: '24px' }}>
        <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)}>
          <TabPane tab="Evolução" key="1">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="Evolução do Desempenho" bordered={false}>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={evolutionData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${Math.round(Number(value))}%`]} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="percentual" 
                          name="Taxa de Acerto" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Histograma de Evolução (Acertos x Erros)" bordered={false}>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={histogramData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}%`]} />
                        <Legend />
                        <Bar dataKey="acertos" name="Acertos" fill="#52c41a" />
                        <Bar dataKey="erros" name="Erros" fill="#ff4d4f" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Fundamentos" key="2">
            <Row gutter={[16, 16]}>
              {Object.entries(performance.avaliacoes.porFundamento).map(([fundamento, dados]) => (
                <Col key={fundamento} span={8}>
                  <Card 
                    bordered={false} 
                    style={{
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      marginBottom: '16px'
                    }}
                  >
                    <h4 style={{ textTransform: 'capitalize', marginBottom: '12px' }}>{fundamento}</h4>
                    <Progress 
                      percent={dados.percentualAcerto} 
                      status={dados.percentualAcerto >= 70 ? 'success' : dados.percentualAcerto >= 50 ? 'normal' : 'exception'} 
                    />
                    <div style={{ marginTop: '12px' }}>
                      <p>Acertos: {dados.acertos} de {dados.total}</p>
                      <p>Percentual: {dados.percentualAcerto.toFixed(1)}%</p>
                      <p>Última avaliação: {dados.ultimaData}</p>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>

          <TabPane tab="Histórico de Treinos" key="3">
            <Table
              dataSource={history}
              columns={historyColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </TabPane>

          <TabPane tab="Metas" key="4">
            {goals.length > 0 ? (
              <Table
                dataSource={goals}
                columns={goalsColumns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <p>Não há metas registradas para este atleta.</p>
              </div>
            )}
          </TabPane>

          <TabPane tab="Nova Avaliação" key="5">
            <Card bordered={false}>
              <h2 style={{ marginBottom: '24px' }}>Registrar Nova Avaliação</h2>
              
              <Form
                form={avaliacaoForm}
                layout="vertical"
                onFinish={handleSubmitAvaliacao}
                initialValues={{
                  fundamento: 'saque',
                  acertos: 0,
                  erros: 0
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="fundamento"
                      label="Fundamento"
                      rules={[{ required: true, message: 'Selecione o fundamento' }]}
                    >
                      <Select>
                        <Select.Option value="saque">Saque</Select.Option>
                        <Select.Option value="recepção">Recepção</Select.Option>
                        <Select.Option value="levantamento">Levantamento</Select.Option>
                        <Select.Option value="ataque">Ataque</Select.Option>
                        <Select.Option value="bloqueio">Bloqueio</Select.Option>
                        <Select.Option value="defesa">Defesa</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="treino_id"
                      label="Treino (opcional)"
                    >
                      <Input placeholder="ID ou nome do treino" />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="acertos"
                      label="Acertos"
                      rules={[{ required: true, message: 'Informe o número de acertos' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="erros"
                      label="Erros"
                      rules={[{ required: true, message: 'Informe o número de erros' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item>
                  <AntButton
                    type="primary"
                    htmlType="submit"
                    loading={submittingAvaliacao}
                    style={{ marginTop: '16px' }}
                  >
                    Registrar Avaliação
                  </AntButton>
                </Form.Item>
              </Form>
              
              <div style={{ marginTop: '32px' }}>
                <h3>Instruções:</h3>
                <p>1. Selecione o fundamento que está sendo avaliado</p>
                <p>2. Se a avaliação estiver relacionada a um treino específico, informe o ID ou nome</p>
                <p>3. Registre a quantidade de acertos e erros observados</p>
                <p>4. Clique em "Registrar Avaliação" para salvar</p>
              </div>
            </Card>
          </TabPane>

          <TabPane tab="Histórico Detalhado" key="6">
            <Card bordered={false}>
              <h2 style={{ marginBottom: '24px' }}>Histórico Detalhado de Treinos</h2>
              <p style={{ marginBottom: '16px' }}>
                Este histórico mostra todos os treinos que o atleta participou ou foi convocado, incluindo presença, 
                justificativas de faltas e desempenho nos fundamentos avaliados. Clique em uma linha para ver os 
                detalhes dos fundamentos avaliados naquele treino.
              </p>
              
              {studentId && <HistoricoTreinosAtleta atletaId={studentId} />}
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default StudentPerformance;
