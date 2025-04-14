import React, { useState, useEffect } from 'react';
import { Table, Card, Button, DatePicker, Radio, Spin, Empty, Badge, Tag, Tabs, Tooltip, Collapse, Space } from 'antd';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileTextOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  CalendarOutlined,
  FilterOutlined,
  RightOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { toast } from 'sonner';
import { getHistoricoTreinoPorAtleta, HistoricoTreinoPorAtleta } from '@/services/performanceService';

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

// Interface local que extende a interface do serviço para adicionar eficiênciaGeral
interface HistoricoTreino extends HistoricoTreinoPorAtleta {
  id: string;
  nome: string;
  data: string;
  dataFormatada: string;
  avaliacoes: {
    fundamento: string;
    acertos: number;
    erros: number;
    eficiencia: number;
  }[];
  eficienciaGeral?: number;
}

interface HistoricoTreinosAtletaProps {
  atletaId: string;
  atletaNome?: string;
}

const HistoricoTreinosAtleta: React.FC<HistoricoTreinosAtletaProps> = ({ atletaId, atletaNome }) => {
  const [historico, setHistorico] = useState<HistoricoTreino[]>([]);
  const [historicoFiltrado, setHistoricoFiltrado] = useState<HistoricoTreino[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPresenca, setFiltroPresenca] = useState<string | null>(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('30');
  const [dataPeriodoPersonalizado, setDataPeriodoPersonalizado] = useState<[Date, Date] | null>(null);

  useEffect(() => {
    carregarHistorico();
  }, [atletaId]);

  useEffect(() => {
    aplicarFiltros();
  }, [historico, filtroPresenca, filtroPeriodo, dataPeriodoPersonalizado]);

  const carregarHistorico = async () => {
    setLoading(true);
    try {
      const dados = await getHistoricoTreinoPorAtleta(atletaId);

      // Calcular eficiência geral para cada treino e transformar no formato esperado
      const dadosProcessados = dados.map(treino => {
        const fundamentos = treino.fundamentos || [];
        
        // Mapear fundamentos para o formato com eficiência
        const avaliacoes = fundamentos.map(f => {
          const total = f.acertos + f.erros;
          const eficiencia = total > 0 ? (f.acertos / total) * 100 : 0;
          
          return {
            ...f,
            eficiencia
          };
        });
        
        // Apenas calcular eficiência se houver avaliações
        let eficienciaGeral = 0;
        
        if (avaliacoes.length > 0) {
          const totalAcertos = avaliacoes.reduce((soma, av) => soma + av.acertos, 0);
          const totalErros = avaliacoes.reduce((soma, av) => soma + av.erros, 0);
          const total = totalAcertos + totalErros;
          
          eficienciaGeral = total > 0 ? (totalAcertos / total) * 100 : 0;
        }
        
        // Converter string ISO para data
        const dataObj = new Date(treino.data);
        
        return {
          ...treino,
          id: treino.treinoId,
          nome: treino.nomeTreino,
          data: dataObj.toISOString(), // Manter formato ISO para ordenação
          dataFormatada: format(dataObj, 'dd/MM/yyyy', { locale: ptBR }),
          avaliacoes,
          eficienciaGeral
        };
      });
      
      setHistorico(dadosProcessados);
    } catch (error) {
      console.error('Erro ao carregar histórico de treinos:', error);
      toast.error('Erro ao carregar histórico de treinos');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...historico];

    // Filtro de presença
    if (filtroPresenca === 'presente') {
      resultado = resultado.filter(treino => treino.presenca);
    } else if (filtroPresenca === 'ausente') {
      resultado = resultado.filter(treino => !treino.presenca);
    }

    // Filtro de período
    if (filtroPeriodo === 'personalizado' && dataPeriodoPersonalizado) {
      const [dataInicial, dataFinal] = dataPeriodoPersonalizado;
      // Ajustar data final para incluir o dia inteiro
      const dataFinalAjustada = new Date(dataFinal);
      dataFinalAjustada.setHours(23, 59, 59, 999);
      
      resultado = resultado.filter(treino => {
        const dataTreino = new Date(treino.data);
        return dataTreino >= dataInicial && dataTreino <= dataFinalAjustada;
      });
    } else if (filtroPeriodo !== 'todos') {
      const diasAtras = parseInt(filtroPeriodo);
      const dataLimite = subDays(new Date(), diasAtras);
      
      resultado = resultado.filter(treino => {
        const dataTreino = new Date(treino.data);
        return dataTreino >= dataLimite;
      });
    }

    setHistoricoFiltrado(resultado);
  };

  const renderFiltros = () => (
    <Card className="mb-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <span className="mr-2 font-medium">Presença:</span>
            <Radio.Group 
              value={filtroPresenca} 
              onChange={e => setFiltroPresenca(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value={null}>Todos</Radio.Button>
              <Radio.Button value="presente">Presentes</Radio.Button>
              <Radio.Button value="ausente">Ausentes</Radio.Button>
            </Radio.Group>
          </div>
          
          <div>
            <span className="mr-2 font-medium">Período:</span>
            <Radio.Group 
              value={filtroPeriodo} 
              onChange={e => setFiltroPeriodo(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="7">7 dias</Radio.Button>
              <Radio.Button value="30">30 dias</Radio.Button>
              <Radio.Button value="personalizado">Personalizado</Radio.Button>
              <Radio.Button value="todos">Todos</Radio.Button>
            </Radio.Group>
          </div>
        </div>
        
        {filtroPeriodo === 'personalizado' && (
          <div>
            <RangePicker 
              format="DD/MM/YYYY"
              value={dataPeriodoPersonalizado as any}
              onChange={(dates) => setDataPeriodoPersonalizado(dates as any)}
            />
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-center gap-2">
        <Badge count={historicoFiltrado.length} overflowCount={9999} style={{ backgroundColor: '#52c41a' }}>
          <span className="px-2 py-1 text-gray-600 text-sm">
            Registros encontrados
          </span>
        </Badge>
        
        <Button 
          type="primary" 
          icon={<FileTextOutlined />} 
          onClick={exportarPDF}
          disabled={historicoFiltrado.length === 0}
        >
          Exportar PDF
        </Button>
      </div>
    </Card>
  );

  const expandedRowRender = (treino: HistoricoTreino) => {
    if (!treino.presenca) {
      return (
        <div className="p-4">
          <div className="font-medium mb-2">Justificativa:</div>
          <div className="bg-gray-50 p-3 rounded border text-muted-foreground">
            {treino.justificativa || 'Nenhuma justificativa fornecida'}
          </div>
        </div>
      );
    }
    
    if (!treino.avaliacoes || treino.avaliacoes.length === 0) {
      return (
        <div className="p-4">
          <Empty description="Nenhuma avaliação registrada para este treino" />
        </div>
      );
    }
    
    const colunas = [
      { title: 'Fundamento', dataIndex: 'fundamento', key: 'fundamento' },
      { 
        title: 'Acertos', 
        dataIndex: 'acertos', 
        key: 'acertos',
        render: (acertos: number) => (
          <span className="text-success">{acertos}</span>
        )
      },
      { 
        title: 'Erros', 
        dataIndex: 'erros', 
        key: 'erros',
        render: (erros: number) => (
          <span className="text-error">{erros}</span>
        )
      },
      { 
        title: 'Eficiência', 
        dataIndex: 'eficiencia', 
        key: 'eficiencia',
        render: (eficiencia: number) => (
          <Tag color={eficiencia >= 70 ? 'success' : eficiencia >= 40 ? 'warning' : 'error'}>
            {eficiencia.toFixed(1)}%
          </Tag>
        )
      },
    ];
    
    return (
      <div className="p-4">
        <div className="font-medium mb-3">Avaliações de Desempenho:</div>
        <Table 
          columns={colunas}
          dataSource={treino.avaliacoes.map((av, i) => ({ ...av, key: `${treino.id}-av-${i}` }))}
          pagination={false}
          size="small"
          bordered
          className="mb-3"
        />
        
        {treino.eficienciaGeral !== undefined && (
          <div className="flex justify-end">
            <div className="text-right">
              <span className="font-medium mr-2">Eficiência Geral:</span>
              <Tag color={treino.eficienciaGeral >= 70 ? 'success' : treino.eficienciaGeral >= 40 ? 'warning' : 'error'} className="text-base">
                {treino.eficienciaGeral.toFixed(1)}%
              </Tag>
            </div>
          </div>
        )}
      </div>
    );
  };

  const exportarPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Título do relatório
      doc.setFontSize(16);
      doc.text(`Histórico de Treinos - ${atletaNome || 'Atleta'}`, 14, 15);
      
      // Informações de filtros
      doc.setFontSize(10);
      let y = 25;
      
      if (filtroPresenca) {
        doc.text(`Presença: ${filtroPresenca === 'presente' ? 'Somente presentes' : 'Somente ausentes'}`, 14, y);
        y += 5;
      }
      
      if (filtroPeriodo === 'personalizado' && dataPeriodoPersonalizado) {
        const [dataInicial, dataFinal] = dataPeriodoPersonalizado;
        doc.text(`Período: ${format(dataInicial, 'dd/MM/yyyy')} a ${format(dataFinal, 'dd/MM/yyyy')}`, 14, y);
      } else if (filtroPeriodo !== 'todos') {
        doc.text(`Período: Últimos ${filtroPeriodo} dias`, 14, y);
      }
      
      y += 10;
      
      // Tabela principal de treinos
      const tableData = historicoFiltrado.map(treino => {
        const presencaStatus = treino.presenca ? 'Presente' : 'Ausente';
        const eficienciaOuJustificativa = treino.presenca 
          ? (treino.eficienciaGeral !== undefined 
             ? `${treino.eficienciaGeral.toFixed(1)}%` 
             : 'Não avaliado')
          : (treino.justificativa || 'Sem justificativa');
            
        return [
          treino.dataFormatada,
          treino.nome,
          presencaStatus,
          eficienciaOuJustificativa
        ];
      });
      
      autoTable(doc, {
        head: [['Data', 'Treino', 'Presença', 'Eficiência/Justificativa']],
        body: tableData,
        startY: y,
        theme: 'grid',
        styles: { 
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak' 
        },
        headStyles: { 
          fillColor: [41, 128, 185], 
          textColor: 255,
          fontStyle: 'bold' 
        },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      
      // Adicionar detalhes de cada treino com avaliações
      y = (doc as any).lastAutoTable.finalY + 15;
      
      historicoFiltrado.forEach((treino, index) => {
        if (treino.presenca && treino.avaliacoes && treino.avaliacoes.length > 0) {
          if (y + 40 > doc.internal.pageSize.getHeight()) {
            doc.addPage();
            y = 15;
          }
          
          doc.setFontSize(11);
          doc.text(`Detalhes do treino: ${treino.nome} (${treino.dataFormatada})`, 14, y);
          
          const avaliacoesData = treino.avaliacoes.map(av => [
            av.fundamento,
            av.acertos.toString(),
            av.erros.toString(),
            `${av.eficiencia.toFixed(1)}%`
          ]);
          
          autoTable(doc, {
            head: [['Fundamento', 'Acertos', 'Erros', 'Eficiência']],
            body: avaliacoesData,
            startY: y + 5,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [100, 100, 100] }
          });
          
          y = (doc as any).lastAutoTable.finalY + 15;
        }
      });
      
      // Adicionar rodapé
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Página ${i} de ${pageCount} - Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Salvar o PDF
      doc.save(`historico-treinos-${atletaNome || 'atleta'}.pdf`);
      
      toast.success('Histórico exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar o histórico para PDF');
    }
  };

  const colunas = [
    { 
      title: 'Data', 
      dataIndex: 'dataFormatada', 
      key: 'data',
      sorter: (a: HistoricoTreino, b: HistoricoTreino) => {
        const dateA = new Date(a.data);
        const dateB = new Date(b.data);
        return dateA.getTime() - dateB.getTime();
      },
      defaultSortOrder: 'descend' as 'descend'
    },
    { 
      title: 'Treino', 
      dataIndex: 'nome', 
      key: 'nome',
      render: (nome: string) => (
        <Tooltip title={nome}>
          <span className="truncate block max-w-[200px]">{nome}</span>
        </Tooltip>
      )
    },
    { 
      title: 'Presença', 
      dataIndex: 'presenca', 
      key: 'presenca',
      render: (presenca: boolean) => (
        presenca ? 
          <Tag icon={<CheckCircleOutlined />} color="success">Presente</Tag> : 
          <Tag icon={<CloseCircleOutlined />} color="error">Ausente</Tag>
      ),
      filters: [
        { text: 'Presente', value: true },
        { text: 'Ausente', value: false }
      ],
      onFilter: (value: boolean, record: HistoricoTreino) => record.presenca === value
    },
    { 
      title: 'Justificativa', 
      dataIndex: 'justificativa', 
      key: 'justificativa',
      render: (justificativa: string, record: HistoricoTreino) => {
        if (record.presenca) {
          return <span className="text-gray-400">-</span>;
        }
        
        return justificativa 
          ? <Tooltip title={justificativa}>
              <span className="truncate block max-w-[150px]">{justificativa}</span>
            </Tooltip>
          : <span className="text-gray-400">Sem justificativa</span>;
      },
      responsive: ['md'] as any
    },
    { 
      title: 'Desempenho', 
      dataIndex: 'eficienciaGeral', 
      key: 'eficienciaGeral',
      render: (eficienciaGeral: number, record: HistoricoTreino) => {
        if (!record.presenca) {
          return <span className="text-gray-400">N/A</span>;
        }
        
        if (eficienciaGeral === undefined) {
          return <span className="text-gray-400">Não avaliado</span>;
        }
        
        return (
          <Tag color={eficienciaGeral >= 70 ? 'success' : eficienciaGeral >= 40 ? 'warning' : 'error'}>
            {eficienciaGeral.toFixed(1)}%
          </Tag>
        );
      }
    },
  ];

  return (
    <div className="space-y-4">
      {renderFiltros()}
      
      {loading ? (
        <div className="flex justify-center p-10">
          <Spin tip="Carregando histórico de treinos..." />
        </div>
      ) : historicoFiltrado.length === 0 ? (
        <Empty 
          description={
            <span>
              Nenhum treino encontrado
              <br />
              <small className="text-gray-500">
                Tente ajustar os filtros ou verifique se o atleta participou de algum treino
              </small>
            </span>
          }
        />
      ) : (
        <Table
          columns={colunas}
          dataSource={historicoFiltrado.map(treino => ({ ...treino, key: treino.id }))}
          expandable={{
            expandedRowRender,
            expandRowByClick: true,
            expandIcon: ({ expanded, onExpand, record }) =>
              expanded ? (
                <DownOutlined onClick={e => onExpand(record, e)} />
              ) : (
                <RightOutlined onClick={e => onExpand(record, e)} />
              )
          }}
          pagination={{ 
            pageSize: 10, 
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} treinos`
          }}
          bordered
          className="shadow-sm"
        />
      )}
    </div>
  );
};

export default HistoricoTreinosAtleta; 