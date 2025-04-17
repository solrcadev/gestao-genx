import React, { useState, useEffect } from 'react';
import { Table, Tag, Spin, Collapse, Progress, Empty, Badge, Card, Row, Col, Select, DatePicker, Button, Space, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { getHistoricoTreinoPorAtleta, HistoricoTreinoPorAtleta } from '@/services/performanceService';
import locale from 'antd/es/date-picker/locale/pt_BR';

interface HistoricoTreinosAtletaProps {
  athleteId: string;
}

const { RangePicker } = DatePicker;

const HistoricoTreinosAtleta: React.FC<HistoricoTreinosAtletaProps> = ({ athleteId }) => {
  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState<HistoricoTreinoPorAtleta[]>([]);
  const [historicoFiltrado, setHistoricoFiltrado] = useState<HistoricoTreinoPorAtleta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { Panel } = Collapse;
  
  // Filtros
  const [filtroPresenca, setFiltroPresenca] = useState<string | null>(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState<[Date, Date] | null>(null);

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getHistoricoTreinoPorAtleta(athleteId);
        setHistorico(data);
        setHistoricoFiltrado(data);
      } catch (err) {
        console.error('Erro ao buscar histórico de treinos:', err);
        setError('Não foi possível carregar o histórico de treinos. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (athleteId) {
      fetchHistorico();
    }
  }, [athleteId]);

  // Aplicar filtros
  useEffect(() => {
    let resultado = [...historico];
    
    // Filtrar por presença
    if (filtroPresenca !== null) {
      const presente = filtroPresenca === 'presente';
      resultado = resultado.filter(item => item.presenca === presente);
    }
    
    // Filtrar por período
    if (filtroPeriodo && filtroPeriodo[0] && filtroPeriodo[1]) {
      resultado = resultado.filter(item => {
        try {
          // Convertendo a string de data (DD/MM/YYYY) para objeto Date
          const parts = item.data.split('/');
          if (parts.length === 3) {
            // Garantir que os valores sejam números
            const ano = Number(parts[2]);
            const mes = Number(parts[1]) - 1; // Mês em JS começa em 0
            const dia = Number(parts[0]);
            
            if (isNaN(ano) || isNaN(mes) || isNaN(dia)) {
              return true; // Se não conseguir converter, mantém o item
            }
            
            const itemDate = new Date(ano, mes, dia);
            return (
              itemDate >= filtroPeriodo[0] && 
              itemDate <= filtroPeriodo[1]
            );
          } else if (parts.length === 2) {
            // Se for apenas DD/MM, consideramos o ano atual
            const currentYear = new Date().getFullYear();
            const mes = Number(parts[1]) - 1;
            const dia = Number(parts[0]);
            
            if (isNaN(mes) || isNaN(dia)) {
              return true; // Se não conseguir converter, mantém o item
            }
            
            const itemDate = new Date(currentYear, mes, dia);
            return (
              itemDate >= filtroPeriodo[0] && 
              itemDate <= filtroPeriodo[1]
            );
          }
          return true;
        } catch (e) {
          console.error('Erro ao converter data para filtro:', e);
          return true;
        }
      });
    }
    
    setHistoricoFiltrado(resultado);
  }, [historico, filtroPresenca, filtroPeriodo]);

  // Limpar todos os filtros
  const limparFiltros = () => {
    setFiltroPresenca(null);
    setFiltroPeriodo(null);
  };

  // Fix the line with the type error (around line 136)
  const calcularDesempenho = (fundamentos: HistoricoTreinoPorAtleta['fundamentos']) => {
    if (!fundamentos.length) return 0;
    
    const totalAcertos = fundamentos.reduce((acc, curr) => acc + curr.acertos, 0);
    const totalExecucoes = fundamentos.reduce((acc, curr) => acc + curr.acertos + curr.erros, 0);
    
    // Convert to number explicitly
    return totalExecucoes > 0 ? Number(((totalAcertos / totalExecucoes) * 100).toFixed(1)) : 0;
  };

  const renderFundamentosDetalhe = (fundamentos: HistoricoTreinoPorAtleta['fundamentos']) => {
    if (!fundamentos.length) {
      return <Empty description="Nenhuma avaliação de fundamento registrada" />;
    }

    return (
      <Row gutter={[16, 16]}>
        {fundamentos.map((fundamento, index) => {
          const total = fundamento.acertos + fundamento.erros;
          const percentualAcerto = total > 0 ? (fundamento.acertos / total) * 100 : 0;
          
          return (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card size="small" title={
                <span style={{ textTransform: 'capitalize' }}>{fundamento.fundamento}</span>
              }>
                <Progress 
                  percent={percentualAcerto.toFixed(1)} 
                  status={percentualAcerto >= 70 ? "success" : percentualAcerto >= 50 ? "normal" : "exception"}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span>Acertos: <strong style={{ color: 'green' }}>{fundamento.acertos}</strong></span>
                  <span>Erros: <strong style={{ color: 'red' }}>{fundamento.erros}</strong></span>
                  <span>Total: <strong>{total}</strong></span>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  const columns = [
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: '15%',
    },
    {
      title: 'Treino',
      dataIndex: 'nomeTreino',
      key: 'nomeTreino',
      width: '25%',
    },
    {
      title: 'Local',
      dataIndex: 'local',
      key: 'local',
      width: '15%',
    },
    {
      title: 'Presença',
      dataIndex: 'presenca',
      key: 'presenca',
      width: '15%',
      render: (presenca: boolean, record: HistoricoTreinoPorAtleta) => (
        <div>
          {presenca ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>Presente</Tag>
          ) : (
            <Tag color="error" icon={<CloseCircleOutlined />}>Ausente</Tag>
          )}
          {!presenca && record.justificativa && (
            <div style={{ marginTop: '4px' }}>
              <Collapse ghost>
                <Panel header={<span style={{ fontSize: '12px', color: '#999' }}>Ver justificativa</span>} key="1">
                  <p style={{ margin: 0, padding: '0 8px' }}>{record.justificativa}</p>
                </Panel>
              </Collapse>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Desempenho',
      key: 'desempenho',
      width: '20%',
      render: (text: string, record: HistoricoTreinoPorAtleta) => {
        const desempenho = calcularDesempenho(record.fundamentos);
        let color = 'red';
        
        if (desempenho >= 70) color = 'green';
        else if (desempenho >= 50) color = 'orange';
        
        if (!record.presenca) {
          return <Tag color="default">Não avaliado</Tag>;
        }
        
        return record.fundamentos.length > 0 ? (
          <Progress 
            percent={parseFloat(desempenho.toFixed(1))} 
            size="small" 
            status={desempenho >= 70 ? "success" : desempenho >= 50 ? "normal" : "exception"} 
          />
        ) : (
          <Tag color="default">Sem avaliações</Tag>
        );
      },
    },
    {
      title: 'Fundamentos',
      key: 'fundamentos',
      width: '10%',
      render: (text: string, record: HistoricoTreinoPorAtleta) => {
        const totalFundamentos = record.fundamentos.length;
        
        if (!record.presenca) {
          return <Badge count={0} showZero />;
        }
        
        return (
          <Badge 
            count={totalFundamentos} 
            showZero 
            style={{ backgroundColor: totalFundamentos > 0 ? '#1890ff' : '#d9d9d9' }} 
          />
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
        <Spin tip="Carregando histórico de treinos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <InfoCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
        <p style={{ margin: '16px 0' }}>{error}</p>
      </div>
    );
  }

  if (!historico.length) {
    return (
      <Empty
        description="Nenhum treino encontrado para este atleta"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div>
      {/* Área de filtros */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <FilterOutlined style={{ marginRight: '8px' }} />
          <span style={{ fontWeight: 'bold' }}>Filtros</span>
        </div>
        
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ marginBottom: '4px' }}>Presença:</label>
              <Select
                placeholder="Filtrar por presença"
                style={{ width: '100%' }}
                allowClear
                value={filtroPresenca}
                onChange={(value) => setFiltroPresenca(value)}
                options={[
                  { value: 'presente', label: 'Apenas presentes' },
                  { value: 'ausente', label: 'Apenas ausentes' }
                ]}
              />
            </div>
          </Col>
          
          <Col xs={24} sm={12}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ marginBottom: '4px' }}>Período:</label>
              <RangePicker 
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                locale={locale}
                onChange={(_, dateStrings) => {
                  if (dateStrings[0] && dateStrings[1]) {
                    const startDate = new Date(dateStrings[0].split('/').reverse().join('-'));
                    const endDate = new Date(dateStrings[1].split('/').reverse().join('-'));
                    setFiltroPeriodo([startDate, endDate]);
                  } else {
                    setFiltroPeriodo(null);
                  }
                }}
              />
            </div>
          </Col>
          
          <Col xs={24} sm={4}>
            <Button 
              icon={<ClearOutlined />} 
              onClick={limparFiltros}
              style={{ marginTop: '24px' }}
            >
              Limpar
            </Button>
          </Col>
        </Row>
        
        {/* Resumo da filtragem */}
        {(filtroPresenca !== null || filtroPeriodo !== null) && (
          <div style={{ marginTop: '16px' }}>
            <Divider style={{ margin: '8px 0' }} />
            <Space wrap>
              {filtroPresenca !== null && (
                <Tag color="blue" closable onClose={() => setFiltroPresenca(null)}>
                  {filtroPresenca === 'presente' ? 'Presente' : 'Ausente'}
                </Tag>
              )}
              
              {filtroPeriodo !== null && (
                <Tag color="blue" closable onClose={() => setFiltroPeriodo(null)}>
                  Período: {filtroPeriodo[0]?.toLocaleDateString('pt-BR')} - {filtroPeriodo[1]?.toLocaleDateString('pt-BR')}
                </Tag>
              )}
            </Space>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
              Mostrando {historicoFiltrado.length} de {historico.length} treinos
            </div>
          </div>
        )}
      </Card>
      
      <Table
        dataSource={historicoFiltrado}
        columns={columns}
        rowKey="treinoId"
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: record => (
            <div style={{ padding: '0 20px' }}>
              <h4 style={{ marginBottom: '16px' }}>Avaliação de Fundamentos</h4>
              {renderFundamentosDetalhe(record.fundamentos)}
            </div>
          ),
          expandRowByClick: true,
        }}
      />
    </div>
  );
};

export default HistoricoTreinosAtleta;
