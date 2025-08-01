import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Euro, CheckCircle, AlertCircle, Briefcase, FileText, Users } from 'lucide-react';

interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  actualHours?: number;
  hourlyRate: number;
  status: 'planned' | 'in-progress' | 'completed' | 'on-hold';
  startDate?: Date;
  endDate?: Date;
  estimatedEndDate: Date;
  tasks: Array<{
    name: string;
    hours: number;
    completed: boolean;
  }>;
}

interface Project {
  id: string;
  name: string;
  client: string;
  totalBudget: number;
  totalHours: number;
  monthlyFixed: number;
  startDate: Date;
  estimatedEndDate: Date;
  phases: ProjectPhase[];
  status: 'active' | 'completed' | 'paused';
}

const ProjectCostDashboard: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string>('legal-engine');

  // Mock data z kosztorysu
  const projects: Project[] = [
    {
      id: 'legal-engine',
      name: 'Platforma Prawna "Legal Engine"',
      client: 'Kancelaria Prawna [Nazwa Kancelarii]',
      totalBudget: 32800,
      totalHours: 192,
      monthlyFixed: 2000,
      startDate: new Date('2024-06-25'),
      estimatedEndDate: new Date('2024-08-22'),
      status: 'active',
      phases: [
        {
          id: 'phase-1',
          name: 'Etap I: Wersja Demonstracyjna (MVP)',
          description: 'Stworzenie w pełni interaktywnego, wizualnie dopracowanego interfejsu użytkownika',
          estimatedHours: 96,
          actualHours: 64,
          hourlyRate: 150,
          status: 'in-progress',
          startDate: new Date('2024-06-25'),
          estimatedEndDate: new Date('2024-07-22'),
          tasks: [
            { name: 'Projekt UI/UX i Architektura', hours: 24, completed: true },
            { name: 'Frontend (Interfejs Klienta)', hours: 60, completed: false },
            { name: 'Backend (Inicjalizacja)', hours: 12, completed: false }
          ]
        },
        {
          id: 'phase-2',
          name: 'Etap II: Pełna Implementacja Funkcjonalności',
          description: 'Rozbudowa prototypu o pełną logikę biznesową i integrację z bazą danych',
          estimatedHours: 96,
          hourlyRate: 150,
          status: 'planned',
          estimatedEndDate: new Date('2024-08-22'),
          tasks: [
            { name: 'Backend (Pełna Logika)', hours: 50, completed: false },
            { name: 'Integracja Frontend z Backend', hours: 30, completed: false },
            { name: 'Testy End-to-End', hours: 16, completed: false }
          ]
        }
      ]
    }
  ];

  const currentProject = projects.find(p => p.id === selectedProject) || projects[0];

  const calculatePhaseProgress = (phase: ProjectPhase): number => {
    const completedTasks = phase.tasks.filter(task => task.completed).length;
    return (completedTasks / phase.tasks.length) * 100;
  };

  const calculateTotalProgress = (): number => {
    const totalTasks = currentProject.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
    const completedTasks = currentProject.phases.reduce(
      (sum, phase) => sum + phase.tasks.filter(task => task.completed).length, 
      0
    );
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in-progress': return 'text-blue-400';
      case 'planned': return 'text-yellow-400';
      case 'on-hold': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4 animate-pulse" />;
      case 'planned': return <Calendar className="w-4 h-4" />;
      case 'on-hold': return <AlertCircle className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gradient">Dashboard Kosztów Projektu</h2>
          <p className="text-muted-foreground mt-2">Monitorowanie postępów i budżetu realizacji</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Data sporządzenia:</span>
          <span className="font-medium">23.05.2024</span>
        </div>
      </div>

      {/* Project Overview */}
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{currentProject.name}</CardTitle>
              <p className="text-muted-foreground mt-1">
                <Users className="w-4 h-4 inline mr-1" />
                {currentProject.client}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              currentProject.status === 'active' ? 'bg-green-400/20 text-green-400' :
              currentProject.status === 'completed' ? 'bg-blue-400/20 text-blue-400' :
              'bg-yellow-400/20 text-yellow-400'
            }`}>
              {currentProject.status.toUpperCase()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {currentProject.totalBudget.toLocaleString()} PLN
              </div>
              <div className="text-sm text-muted-foreground">Całkowity Budżet</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {currentProject.totalHours}h
              </div>
              <div className="text-sm text-muted-foreground">Szacowane Godziny</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                150 PLN/h
              </div>
              <div className="text-sm text-muted-foreground">Stawka Godzinowa</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {calculateTotalProgress().toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Postęp Ogólny</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Postęp realizacji</span>
              <span>{calculateTotalProgress().toFixed(1)}%</span>
            </div>
            <div className="w-full bg-background/30 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
                style={{ width: `${calculateTotalProgress()}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Phases */}
      <div className="grid gap-6">
        {currentProject.phases.map((phase, index) => (
          <Card key={phase.id} className="glass-effect hover-scale transition-all duration-300">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`${getStatusColor(phase.status)}`}>
                      {getStatusIcon(phase.status)}
                    </div>
                    {phase.name}
                  </CardTitle>
                  <p className="text-muted-foreground mt-2">{phase.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {(phase.estimatedHours * phase.hourlyRate + currentProject.monthlyFixed).toLocaleString()} PLN
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {phase.estimatedHours}h + koszty stałe
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Timeline */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Planowany termin:</span>
                    <span className="font-medium">
                      {phase.estimatedEndDate.toLocaleDateString()}
                    </span>
                  </div>
                  {phase.startDate && (
                    <div className="flex items-center gap-1">
                      <span>Rozpoczęte:</span>
                      <span className="font-medium">
                        {phase.startDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Postęp zadań</span>
                    <span>{calculatePhaseProgress(phase).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-background/30 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculatePhaseProgress(phase)}%` }}
                    />
                  </div>
                </div>

                {/* Tasks Breakdown */}
                <div className="space-y-2">
                  <h4 className="font-medium">Szczegółowy zakres prac:</h4>
                  <div className="space-y-2">
                    {phase.tasks.map((task, taskIndex) => (
                      <div
                        key={taskIndex}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          task.completed ? 'bg-green-400/10 border border-green-400/20' : 'bg-background/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className={`w-4 h-4 ${
                            task.completed ? 'text-green-400' : 'text-muted-foreground'
                          }`} />
                          <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                            {task.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{task.hours}h</div>
                          <div className="text-xs text-muted-foreground">
                            {(task.hours * phase.hourlyRate).toLocaleString()} PLN
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phase Summary */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">
                      {phase.estimatedHours}h
                    </div>
                    <div className="text-xs text-muted-foreground">Szacowane</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">
                      {(phase.estimatedHours * phase.hourlyRate).toLocaleString()} PLN
                    </div>
                    <div className="text-xs text-muted-foreground">Praca netto</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-accent">
                      {currentProject.monthlyFixed.toLocaleString()} PLN
                    </div>
                    <div className="text-xs text-muted-foreground">Koszty stałe</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Summary */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="w-5 h-5 text-primary" />
            Podsumowanie Finansowe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {currentProject.phases.map((phase, index) => (
                  <div key={phase.id} className="flex justify-between items-center">
                    <span>{phase.name}</span>
                    <span className="font-bold">
                      {(phase.estimatedHours * phase.hourlyRate + currentProject.monthlyFixed).toLocaleString()} PLN
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="bg-background/30 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Łączne godziny:</span>
                    <span className="font-medium">{currentProject.totalHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stawka godzinowa:</span>
                    <span className="font-medium">150 PLN netto</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Koszty stałe (2 miesiące):</span>
                    <span className="font-medium">4 000 PLN</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>CAŁKOWITA WARTOŚĆ:</span>
                      <span className="text-primary">{currentProject.totalBudget.toLocaleString()} PLN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-400/10 border border-blue-400/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-400 mb-2">Elastyczne podejście etapowe</h4>
              <p className="text-sm text-muted-foreground">
                Podział projektu na etapy zapewnia pełną kontrolę nad procesem twórczym i budżetem. 
                Po zakończeniu Etapu I będziemy mogli wspólnie omówić ewentualne modyfikacje przed 
                zatwierdzeniem rozpoczęcia prac nad Etapem II.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectCostDashboard;