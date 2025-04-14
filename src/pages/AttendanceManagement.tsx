import { supabase } from '@/lib/supabase';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Select, 
  Form, 
  Button, 
  Space, 
  Typography, 
  Spin, 
  Row, 
  Col, 
  DatePicker, 
  Input, 
  AutoComplete,
  Flex,
  Badge,
  Empty,
  Modal,
  Switch
} from 'antd';
import { SearchOutlined, FilterOutlined, FileExcelOutlined, ReloadOutlined, CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import locale from 'antd/es/date-picker/locale/pt_BR';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { 
  buscarPresencas, 
  buscarAtletas,
  Presenca, 
  FiltroPresenca,
  verificarPresencaDuplicada,
  atualizarStatusPresenca
} from '@/services/presencaService';
import AttendanceTable from '@/components/presenca/AttendanceTable';
import { Button as ShadcnButton } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Adicionado a definição de tipo para o treino no objeto tdd
type TreinoDoDia = {
  id: string;
  treino?: {
    id: string;
    nome: string;
    data: string;
  };
};

const AttendanceManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [novoRegistroForm] = Form.useForm();
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [filtros, setFiltros] = useState<FiltroPresenca>({});
  const [atletas, setAtletas] = useState<any[]>([]);
  const [atletasOptions, setAtletasOptions] = useState<{ value: string; label: string }[]>([]);
  const [treinosOptions, setTreinosOptions] = useState<{ value: string; label: string }[]>([]);
  const [modalNovoRegistroVisivel, setModalNovoRegistroVisivel] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setIsLoading(true);
        
        // Buscar atletas para o autocomplete primeiro
        try {
          const dadosAtletas = await buscarAtletas();
          setAtletas(dadosAtletas);
          
          // Transformar atletas para o formato do autocomplete
          const options = dadosAtletas.map(atleta => ({
            value: atleta.id,
            label: `${atleta.nome} (${atleta.posicao || 'Sem posição'}) - ${atleta.time || 'Sem time'}`
          }));
          setAtletasOptions(options);
        } catch (error) {
          console.error('Erro ao carregar atletas:', error);
        }
        
        // Buscar treinos do dia para o autocomplete
        try {
          const { data: treinosDosDia } = await supabase
            .from('treinos_do_dia')
            .select(`
              id,
              treino:treino_id (id, nome, data)
            `)
            .order('data', { ascending: false });
            
          if (treinosDosDia) {
            // Transformar os dados para o formato esperado
            const treinosFormatados = treinosDosDia.map(tdd => {
              return {
                id: tdd.id,
                treino: tdd.treino as unknown as {
                  id: string;
                  nome: string;
                  data: string;
                }
              } as TreinoDoDia;
            });
            
            const options = treinosFormatados.map(tdd => ({
              value: tdd.id,
              label: `${tdd.treino?.nome || 'Sem nome'} (${new Date(tdd.treino?.data || '').toLocaleDateString('pt-BR')})`
            }));
            setTreinosOptions(options);
          }
        } catch (error) {
          console.error('Erro ao carregar treinos do dia:', error);
        }
        
        // Buscar presenças iniciais sem filtro
        try {
          const dadosPresencas = await buscarPresencas();
          setPresencas(dadosPresencas);
        } catch (error) {
          console.error('Erro ao carregar presenças:', error);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarDados();
  }, []);
  
  // Abrir modal para criar novo registro
  const abrirModalNovoRegistro = () => {
    novoRegistroForm.resetFields();
    setModalNovoRegistroVisivel(true);
  };
  
  // Fechar modal de novo registro
  const fecharModalNovoRegistro = () => {
    setModalNovoRegistroVisivel(false);
  };
  
  // Salvar novo registro de presença
  const salvarNovoRegistro = async (values: any) => {
    try {
      setSalvandoNovo(true);
      
      const { atletaId, treinoDoDiaId, status, justificativa } = values;
      
      // Verificar se já existe um registro para este atleta e treino
      const { duplicada, presencaExistente } = await verificarPresencaDuplicada(atletaId, treinoDoDiaId);
      
      if (duplicada) {
        // Se já existe, perguntar se deseja atualizar
        Modal.confirm({
          title: 'Registro duplicado',
          content: 'Já existe um registro de presença para este atleta neste treino. Deseja atualizar o status?',
          okText: 'Sim, atualizar',
          cancelText: 'Cancelar',
          onOk: async () => {
            if (presencaExistente) {
              const resultado = await atualizarStatusPresenca(
                presencaExistente.id, 
                status, 
                status === 'ausente' ? justificativa : undefined
              );
              
              if (resultado) {
                toast.success('Registro atualizado com sucesso');
                fecharModalNovoRegistro();
                buscarPresencasSemFiltro();
              } else {
                toast.error('Erro ao atualizar registro');
              }
            }
          }
        });
        return;
      }
      
      // Criar novo registro
      const { error } = await supabase
        .from('treinos_presencas')
        .insert([{
          atleta_id: atletaId,
          treino_do_dia_id: treinoDoDiaId,
          presente: status === 'presente',
          justificativa: status === 'ausente' ? justificativa : null,
        }]);
        
      if (error) {
        console.error('Erro ao criar registro de presença:', error);
        toast.error('Erro ao criar registro');
        return;
      }
      
      toast.success('Registro criado com sucesso');
      fecharModalNovoRegistro();
      buscarPresencasSemFiltro();
    } catch (error) {
      console.error('Erro ao salvar novo registro:', error);
      toast.error('Erro ao criar registro');
    } finally {
      setSalvandoNovo(false);
    }
  };
  
  // Aplicar filtros
  const aplicarFiltros = async (values: any) => {
    try {
      setIsLoading(true);
      
      // Normalizar valores do formulário
      const novosFiltros: FiltroPresenca = {
        atletaId: values.atletaId || undefined,
        time: values.time || undefined,
        status: values.status || undefined,
        dataInicial: values.periodo?.[0]?.toDate() || undefined,
        dataFinal: values.periodo?.[1]?.toDate() || undefined,
      };
      
      setFiltros(novosFiltros);
      
      const dadosFiltrados = await buscarPresencas(novosFiltros);
      setPresencas(dadosFiltrados);
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Limpar filtros
  const limparFiltros = () => {
    form.resetFields();
    setFiltros({});
    buscarPresencasSemFiltro();
  };
  
  // Buscar presenças sem filtro
  const buscarPresencasSemFiltro = async () => {
    try {
      setIsLoading(true);
      const dados = await buscarPresencas();
      setPresencas(dados);
    } catch (error) {
      console.error('Erro ao buscar presenças:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Exportar para PDF
  const exportarParaPDF = () => {
    try {
      // Criar uma nova instância do jsPDF
      const doc = new jsPDF();
      
      // Título do relatório
      doc.setFontSize(16);
      doc.text('Relatório de Presenças', 14, 15);
      
      // Informações de filtros
      doc.setFontSize(10);
      let y = 25;
      
      if (filtros.time) {
        doc.text(`Time: ${filtros.time.charAt(0).toUpperCase() + filtros.time.slice(1)}`, 14, y);
        y += 5;
      }
      
      if (filtros.status) {
        doc.text(`Status: ${filtros.status.charAt(0).toUpperCase() + filtros.status.slice(1)}`, 14, y);
        y += 5;
      }
      
      if (filtros.dataInicial && filtros.dataFinal) {
        const dataInicial = filtros.dataInicial.toLocaleDateString('pt-BR');
        const dataFinal = filtros.dataFinal.toLocaleDateString('pt-BR');
        doc.text(`Período: ${dataInicial} a ${dataFinal}`, 14, y);
        y += 10;
      } else {
        y += 5;
      }
      
      // Tabela de dados
      const tableData = presencas.map(p => [
        p.atleta?.nome || 'Nome não disponível',
        p.atleta?.time || 'Time não informado',
        p.treino?.nome || 'Treino não informado',
        p.treino?.data ? new Date(p.treino.data).toLocaleDateString('pt-BR') : 'Data não disponível',
        p.status === 'presente' ? 'Presente' : 'Ausente',
        p.justificativa || (p.status === 'presente' ? '—' : 'Não justificado')
      ]);
      
      // Aplicar o autoTable utilizando a função importada
      autoTable(doc, {
        head: [['Atleta', 'Time', 'Treino', 'Data', 'Status', 'Justificativa']],
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
        alternateRowStyles: { fillColor: [240, 240, 240] },
        columnStyles: {
          0: { cellWidth: 'auto' }, // Atleta
          1: { cellWidth: 'auto' }, // Time
          2: { cellWidth: 'auto' }, // Treino
          3: { cellWidth: 'auto' }, // Data
          4: { cellWidth: 'auto' }, // Status
          5: { cellWidth: 50 }      // Justificativa com largura maior
        }
      });
      
      // Adicionar rodapé
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Salvar o PDF
      doc.save('relatorio-presencas.pdf');
      
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar relatório PDF. Verifique o console para mais detalhes.');
    }
  };
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2}>Gestão de Presenças e Justificativas</Title>
          <Text>Visualize, filtre e gerencie a presença dos atletas e suas justificativas.</Text>
        </div>
        
        {/* Botão de adicionar novo registro */}
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={abrirModalNovoRegistro}
          className="bg-blue-600"
        >
          Novo Registro
        </Button>
      </div>
      
      <Card className="mb-6 bg-gray-50">
        <Form
          form={form}
          layout="vertical"
          onFinish={aplicarFiltros}
          initialValues={{ time: null, status: null }}
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="atletaId" label="Atleta">
                <AutoComplete
                  options={atletasOptions}
                  placeholder="Buscar atleta"
                  filterOption={(inputValue, option) =>
                    option?.label.toLowerCase().includes(inputValue.toLowerCase())
                  }
                  notFoundContent="Nenhum atleta encontrado"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8}>
              <Form.Item name="periodo" label="Período">
                <RangePicker 
                  locale={locale}
                  format="DD/MM/YYYY"
                  placeholder={['Data inicial', 'Data final']}
                  className="w-full"
                />
              </Form.Item>
            </Col>
            
            <Col xs={12} md={4}>
              <Form.Item name="status" label="Status">
                <Select placeholder="Todos" allowClear>
                  <Option value="presente">Presente</Option>
                  <Option value="ausente">Ausente</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={12} md={4}>
              <Form.Item name="time" label="Time">
                <Select placeholder="Todos" allowClear>
                  <Option value="masculino">Masculino</Option>
                  <Option value="feminino">Feminino</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row>
            <Col span={24}>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<FilterOutlined />}
                  loading={isLoading}
                >
                  Filtrar
                </Button>
                <Button 
                  onClick={limparFiltros}
                  icon={<ReloadOutlined />}
                  disabled={isLoading}
                >
                  Limpar Filtros
                </Button>
                <Button
                  type="default"
                  icon={<FileExcelOutlined />}
                  onClick={exportarParaPDF}
                  disabled={presencas.length === 0 || isLoading}
                >
                  Exportar PDF
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
      
      {/* Contador de resultados */}
      <div className="mb-4 flex justify-between">
        <Badge
          count={presencas.length}
          overflowCount={9999}
          style={{ backgroundColor: '#52c41a' }}
        >
          <span className="px-2 py-1 text-gray-600 text-sm">
            Registros encontrados
          </span>
        </Badge>
        
        {/* Indicadores de filtros ativos */}
        <div className="flex flex-wrap gap-2">
          {filtros.time && (
            <Badge 
              count="Time" 
              style={{ backgroundColor: '#108ee9' }}
              title={`Time: ${filtros.time}`}
            />
          )}
          {filtros.status && (
            <Badge 
              count="Status" 
              style={{ backgroundColor: '#87d068' }}
              title={`Status: ${filtros.status}`}
            />
          )}
          {filtros.atletaId && (
            <Badge 
              count="Atleta" 
              style={{ backgroundColor: '#722ed1' }}
              title="Filtrado por atleta específico"
            />
          )}
          {(filtros.dataInicial || filtros.dataFinal) && (
            <Badge 
              count="Período" 
              style={{ backgroundColor: '#fa8c16' }}
              title="Filtro de período aplicado"
            />
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <Spin tip="Carregando registros de presença..." />
        </div>
      ) : presencas.length === 0 ? (
        <Card className="text-center py-10">
          <Empty 
            description={
              <span>
                Nenhum registro de presença encontrado
                <br />
                <small className="text-gray-500">
                  {Object.keys(filtros).some(k => (filtros as any)[k]) 
                    ? "Tente ajustar os filtros para ver mais resultados"
                    : "Comece adicionando presenças em 'Treino do Dia' ou clique em 'Novo Registro'"}
                </small>
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <AttendanceTable
          presencas={presencas}
          isLoading={isLoading}
          refetch={buscarPresencasSemFiltro}
        />
      )}
      
      {/* Modal para criar novo registro de presença */}
      <Modal
        title="Novo Registro de Presença"
        open={modalNovoRegistroVisivel}
        onCancel={fecharModalNovoRegistro}
        footer={null}
      >
        <Form
          form={novoRegistroForm}
          layout="vertical"
          onFinish={salvarNovoRegistro}
          initialValues={{ status: 'presente' }}
        >
          <Form.Item
            name="atletaId"
            label="Atleta"
            rules={[{ required: true, message: 'Por favor, selecione o atleta' }]}
          >
            <Select
              showSearch
              placeholder="Selecione o atleta"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={atletasOptions}
            />
          </Form.Item>
          
          <Form.Item
            name="treinoDoDiaId"
            label="Treino"
            rules={[{ required: true, message: 'Por favor, selecione o treino' }]}
          >
            <Select
              showSearch
              placeholder="Selecione o treino"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={treinosOptions}
            />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="Status"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Presente"
              unCheckedChildren="Ausente"
              defaultChecked
              onChange={(checked) => {
                novoRegistroForm.setFieldsValue({ status: checked ? 'presente' : 'ausente' });
              }}
            />
          </Form.Item>
          
          <Form.Item
            name="justificativa"
            label="Justificativa"
            dependencies={['status']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('status') === 'ausente' && !value) {
                    return Promise.reject('Por favor, informe a justificativa para a ausência');
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Informe a justificativa (obrigatório para ausências)"
              disabled={novoRegistroForm.getFieldValue('status') === 'presente'}
            />
          </Form.Item>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button onClick={fecharModalNovoRegistro}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={salvandoNovo}>
              Salvar
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AttendanceManagement; 