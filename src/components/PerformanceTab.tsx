
import { useEffect, useState } from 'react';
import { Card } from 'antd';
import { 
  getStudentPerformance, 
  getTrainingHistory, 
  getStudentGoals,
  TrainingHistory, 
  Goal,
  StudentPerformance
} from '@/services/performanceService';
import { Progress } from '@/components/ui/progress';

interface PerformanceTabProps {
  studentId: string;
}

export function PerformanceTab({ studentId }: PerformanceTabProps) {
  const [performance, setPerformance] = useState<StudentPerformance | null>(null);
  const [history, setHistory] = useState<TrainingHistory[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [performanceData, historyData, goalsData] = await Promise.all([
          getStudentPerformance(studentId),
          getTrainingHistory(studentId),
          getStudentGoals(studentId)
        ]);

        setPerformance(performanceData);
        setHistory(historyData);
        setGoals(goalsData);
      } catch (error) {
        console.error('Erro ao carregar dados de performance:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [studentId]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!performance) {
    return <div>Não foi possível carregar os dados de performance</div>;
  }

  const items = [
    {
      key: '1',
      label: 'Visão Geral',
      children: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Frequência">
            <Progress value={performance.frequency} />
          </Card>
          <Card title="Evolução">
            <Progress value={performance.evolution} />
          </Card>
          <Card title="Treinos Concluídos">
            <Progress value={(performance.completedTrainings || 0) / (performance.totalTrainings || 1) * 100} />
          </Card>
          <Card title="Metas Alcançadas">
            <Progress value={(performance.achievedGoals || 0) / (performance.totalGoals || 1) * 100} />
          </Card>
        </div>
      ),
    },
    {
      key: '2',
      label: 'Progresso',
      children: (
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Gráfico de Progresso</h3>
          {/* Aqui será implementado o gráfico de progresso */}
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            Gráfico de Progresso
          </div>
        </div>
      ),
    },
    {
      key: '3',
      label: 'Histórico',
      children: (
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Histórico de Treinos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Duração</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{item.type}</td>
                    <td className="px-4 py-2">{item.duration} min</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'missed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status === 'completed' ? 'Concluído' :
                         item.status === 'missed' ? 'Faltou' : 'Parcial'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      key: '4',
      label: 'Metas',
      children: (
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Metas</h3>
          <div className="space-y-4">
            {goals.map((goal) => (
              <Card key={goal.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{goal.title}</h4>
                    <p className="text-gray-600">{goal.description}</p>
                    <p className="text-sm text-gray-500">
                      Data alvo: {new Date(goal.targetDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded ${
                    goal.status === 'achieved' ? 'bg-green-100 text-green-800' :
                    goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {goal.status === 'achieved' ? 'Alcançada' :
                     goal.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                  </span>
                </div>
                <Progress value={goal.progress} className="mt-4" />
              </Card>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return <Card>{items[0].children}</Card>;
}
