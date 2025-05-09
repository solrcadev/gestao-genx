import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Empty,
  Spin,
  Badge,
  Tooltip,
  Space,
  Switch,
  notification,
  Popconfirm,
  message,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  SaveOutlined,
  CloseOutlined,
  LockOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { 
  Presenca, 
  FiltroPresenca, 
  formatarData, 
  atualizarJustificativa,
  buscarFaltasPorAtleta,
  atualizarStatusPresenca,
  excluirPresenca,
  verificarTreinoFinalizado
} from '@/services/presencaService';
import { toast } from 'sonner';

interface AttendanceTableProps {
  presencas: Presenca[];
  isLoading: boolean;
  refetch: () => void;
}

interface EditorState {
  id: string | null;
  status: 'presente' | 'ausente';
  justificativa: string;
  editandoStatus: boolean; // Determina se está editando o status ou a justificativa
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ 
  presencas, 
  isLoading, 
  refetch 
}) => {
  const [form] = Form.useForm();
  const [editor, setEditor] = useState<EditorState>({
    id: null,
    status: 'presente',
    justificativa: '',
    editandoStatus: false
  });
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [faltasPorAtleta, setFaltasPorAtleta] = useState<Record<string, number>>({});
  const [treinosFinalizados, setTreinosFinalizados] = useState<Record<string, boolean>>({});

  // Buscar faltas por atleta e verificar treinos finalizados
  useEffect(() => {
    const carregarDados = async () => {
      // Carregar faltas por atleta
      const faltas: Record<string, number> = {};
      for (const presenca of presencas) {
        if (presenca.atleta_id && !faltas[presenca.atleta_id]) {
          faltas[presenca.atleta_id] = await buscarFaltasPorAtleta(presenca.atleta_id);
        }
      }
      setFaltasPorAtleta(faltas);

      // Verificar quais treinos estão finalizados
      const treinosIds = [...new Set(presencas.map(p => p.treino_do_dia_id).filter(Boolean))];
      const finalizados: Record<string, boolean> = {};
      
      for (const treinoId of treinosIds) {
        if (treinoId) {
          finalizados[treinoId] = await verificarTreinoFinalizado(treinoId);
        }
      }
      
      setTreinosFinalizados(finalizados);
    };
    
    carregarDados();
  }, [presencas]);

  // Iniciar edição de registro
  const iniciarEdicao = (record: Presenca, editarStatus: boolean = false) => {
    setEditor({
      id: record.id,
      status: record.status,
      justificativa: record.justificativa || '',
      editandoStatus: editarStatus
    });
    
    form.setFieldsValue({ 
      status: record.status,
      justificativa: record.justificativa || ''
    });
  };

  // Cancelar edição
  const cancelarEdicao = () => {
    setEditor({
      id: null,
      status: 'presente',
      justificativa: '',
      editandoStatus: false
    });
    form.resetFields();
  };

  // Salvar alterações no status
  const salvarStatusPresenca = async (record: Presenca) => {
    try {
      setSalvando(true);
      
      const resultado = await atualizarStatusPresenca(
        record.id, 
        editor.status, 
        editor.status === 'ausente' ? editor.justificativa : undefined
      );
      
      if (resultado) {
        toast.success(`Status atualizado para ${editor.status === 'presente' ? 'Presente' : 'Ausente'}`);
        cancelarEdicao();
        refetch();
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status de presença:', error);
      toast.error('Ocorreu um erro ao salvar as alterações');
    } finally {
      setSalvando(false);
    }
  };

  // Salvar justificativa
  const salvarJustificativa = async (record: Presenca) => {
    try {
      setSalvando(true);
      
      const resultado = await atualizarJustificativa(record.id, editor.justificativa);
      
      if (resultado) {
        toast.success('Justificativa salva com sucesso');
        cancelarEdicao();
        refetch();
      } else {
        toast.error('Erro ao salvar justificativa');
      }
    } catch (error) {
      console.error('Erro ao salvar justificativa:', error);
      toast.error('Ocorreu um erro ao salvar a justificativa');
    } finally {
      setSalvando(false);
    }
  };

  // Excluir registro de presença
  const excluirRegistroPresenca = async (record: Presenca) => {
    try {
      setExcluindo(true);
      
      const sucesso = await excluirPresenca(record.id);
      
      if (sucesso) {
        toast.success('Registro excluído com sucesso');
        refetch();
      } else {
        toast.error('Erro ao excluir registro');
      }
    } catch (error) {
      console.error('Erro ao excluir registro de presença:', error);
      toast.error('Ocorreu um erro ao excluir o registro');
    } finally {
      setExcluindo(false);
    }
  };

  // Verificar se um registro pode ser editado (não está em um treino finalizado)
  const podeEditar = (record: Presenca) => {
    if (!record.treino_do_dia_id) return true;
    return !treinosFinalizados[record.treino_do_dia_id];
  };

  const columns: ColumnsType<Presenca> = [
    {
      title: 'Atleta',
      key: 'atleta',
      render: (_, record) => {
        const atletaNome = record.atleta?.nome || 'Nome não disponível';
        const temMuitasFaltas = faltasPorAtleta[record.atleta_id] >= 3;
        
        return (
          <div className="flex items-center gap-2">
            {atletaNome}
            {temMuitasFaltas && record.status === 'ausente' && (
              <Tooltip title={`${faltasPorAtleta[record.atleta_id]} faltas no último mês`}>
                <Badge 
                  count={<WarningOutlined style={{ color: 'red' }} />}
                />
              </Tooltip>
            )}
            {!podeEditar(record) && (
              <Tooltip title="Treino já finalizado - Não é possível alterar">
                <Badge 
                  count={<LockOutlined style={{ color: 'grey' }} />}
                />
              </Tooltip>
            )}
          </div>
        );
      },
      sorter: (a, b) => {
        const nomeA = a.atleta?.nome || '';
        const nomeB = b.atleta?.nome || '';
        return nomeA.localeCompare(nomeB);
      },
    },
    {
      title: 'Posição',
      dataIndex: ['atleta', 'posicao'],
      key: 'posicao',
      responsive: ['md'],
    },
    {
      title: 'Time',
      dataIndex: ['atleta', 'time'],
      key: 'time',
      render: (time) => (
        <Tag color={time?.toLowerCase() === 'masculino' ? 'blue' : 'purple'}>
          {time || 'Não informado'}
        </Tag>
      ),
    },
    {
      title: 'Treino',
      dataIndex: ['treino', 'nome'],
      key: 'treino',
      responsive: ['md'],
    },
    {
      title: 'Data do Treino',
      key: 'data',
      render: (_, record) => formatarData(record.treino?.data),
      sorter: (a, b) => {
        const dataA = a.treino?.data ? new Date(a.treino.data).getTime() : 0;
        const dataB = b.treino?.data ? new Date(b.treino.data).getTime() : 0;
        return dataA - dataB;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Presenca) => {
        // Modo de edição para status
        if (editor.id === record.id && editor.editandoStatus) {
          return (
            <Form form={form} layout="inline">
              <Form.Item name="status">
                <Switch
                  checked={editor.status === 'presente'}
                  onChange={(checked) => setEditor({...editor, status: checked ? 'presente' : 'ausente'})}
                  checkedChildren="Presente"
                  unCheckedChildren="Ausente"
                  className="min-w-[100px]"
                />
              </Form.Item>
              <div className="mt-2 flex space-x-2">
                <Button 
                  icon={<SaveOutlined />} 
                  size="small" 
                  type="primary"
                  onClick={() => salvarStatusPresenca(record)}
                  loading={salvando}
                >
                  Salvar
                </Button>
                <Button 
                  icon={<CloseOutlined />} 
                  size="small" 
                  onClick={cancelarEdicao}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
              </div>
            </Form>
          );
        }
        
        // Visualização normal
        const presente = status === 'presente';
        return (
          <Tag 
            color={presente ? 'success' : 'error'}
            icon={presente ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            className="cursor-pointer"
            onClick={() => podeEditar(record) && iniciarEdicao(record, true)}
          >
            {presente ? 'Presente' : 'Ausente'}
          </Tag>
        );
      },
      filters: [
        { text: 'Presente', value: 'presente' },
        { text: 'Ausente', value: 'ausente' }
      ],
      onFilter: (value: string, record: Presenca) => record.status === value
    },
    {
      title: 'Justificativa',
      dataIndex: 'justificativa',
      key: 'justificativa',
      render: (texto: string, record: Presenca) => {
        // Modo de edição para justificativa
        if (editor.id === record.id && !editor.editandoStatus) {
          return (
            <Form form={form} layout="inline">
              <Form.Item name="justificativa" style={{ width: '100%', marginRight: 0 }}>
                <Input.TextArea 
                  value={editor.justificativa}
                  onChange={e => setEditor({...editor, justificativa: e.target.value})}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  placeholder="Informe a justificativa..."
                />
              </Form.Item>
              <div className="mt-2 flex justify-end space-x-2">
                <Button 
                  icon={<SaveOutlined />} 
                  size="small" 
                  type="primary"
                  onClick={() => salvarJustificativa(record)}
                  loading={salvando}
                >
                  Salvar
                </Button>
                <Button 
                  icon={<CloseOutlined />} 
                  size="small" 
                  onClick={cancelarEdicao}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
              </div>
            </Form>
          );
        }
        
        // Visualização normal
        return (
          <div 
            className={`${podeEditar(record) && record.status === 'ausente' ? 'cursor-pointer hover:bg-gray-50 p-1 rounded' : ''}`}
            onClick={() => {
              if (podeEditar(record) && record.status === 'ausente') {
                iniciarEdicao(record, false);
              }
            }}
          >
            {texto ? (
              <Tooltip title={texto}>
                <div className="max-w-[200px] truncate">{texto}</div>
              </Tooltip>
            ) : (
              <span className="text-gray-400">
                {record.status === 'presente' ? '—' : 'Não justificado'}
              </span>
            )}
          </div>
        );
      },
      responsive: ['md'],
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_: any, record: Presenca) => {
        // Se estiver editando, não mostrar botões
        if (editor.id === record.id) {
          return null;
        }
        
        // Verificar se o treino está finalizado
        const treinoFinalizado = !podeEditar(record);
        
        return (
          <Space>
            {!treinoFinalizado && (
              <>
                {/* Botão de edição de status */}
                <Button 
                  icon={<EditOutlined />} 
                  type="link" 
                  onClick={() => iniciarEdicao(record, true)}
                  title="Editar status"
                />
                
                {/* Botão de edição de justificativa - apenas se ausente */}
                {record.status === 'ausente' && (
                  <Button 
                    icon={<EditOutlined />} 
                    type="link" 
                    onClick={() => iniciarEdicao(record, false)}
                    title="Editar justificativa"
                  />
                )}
                
                {/* Botão de exclusão */}
                <Popconfirm
                  title="Excluir registro?"
                  description="Esta ação não pode ser desfeita."
                  okText="Sim"
                  cancelText="Não"
                  onConfirm={() => excluirRegistroPresenca(record)}
                  icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                >
                  <Button 
                    icon={<DeleteOutlined />} 
                    type="link" 
                    danger
                    loading={excluindo}
                    title="Excluir registro"
                  />
                </Popconfirm>
              </>
            )}
            
            {treinoFinalizado && (
              <span className="text-gray-400">Treino finalizado</span>
            )}
          </Space>
        );
      },
    },
  ];

  if (presencas.length === 0 && !isLoading) {
    return (
      <Empty 
        description="Nenhum registro de presença encontrado" 
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Card className="w-full overflow-x-auto">
      <Table
        columns={columns}
        dataSource={presencas}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Nenhum registro de presença encontrado"
            />
          ),
        }}
      />
    </Card>
  );
};

export default AttendanceTable; 