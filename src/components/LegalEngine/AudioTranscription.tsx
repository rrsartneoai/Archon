import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Mic, FileAudio, Play, Pause, Download, Users, Clock, CheckCircle } from 'lucide-react';

interface TranscriptionJob {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  fileName: string;
  fileSize: number;
  duration?: number;
  createdAt: Date;
  completedAt?: Date;
  speakerCount?: number;
  transcriptionId?: string;
}

interface SpeakerMapping {
  [key: string]: string; // Speaker 1 -> "Jan Kowalski"
}

const AudioTranscription: React.FC = () => {
  const [jobs, setJobs] = useState<TranscriptionJob[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');

  // Mock transkrypcje - w produkcji połączyć z Supabase
  const mockJobs: TranscriptionJob[] = [
    {
      id: '1',
      title: 'Rozprawa sądowa - sprawa o najem',
      status: 'completed',
      progress: 100,
      fileName: 'rozprawa_2024_01_15.mp3',
      fileSize: 12.5 * 1024 * 1024,
      duration: 3600,
      createdAt: new Date('2024-01-15T10:00:00'),
      completedAt: new Date('2024-01-15T10:15:00'),
      speakerCount: 3,
      transcriptionId: 'trans_1'
    },
    {
      id: '2',
      title: 'Konsultacja z klientem - RODO',
      status: 'processing',
      progress: 65,
      fileName: 'konsultacja_rodo.wav',
      fileSize: 8.2 * 1024 * 1024,
      duration: 2400,
      createdAt: new Date('2024-01-20T14:30:00'),
      speakerCount: 2
    }
  ];

  React.useEffect(() => {
    setJobs(mockJobs);
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTitle(`Transkrypcja ${file.name.split('.')[0]}`);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;

    setIsUploading(true);

    const newJob: TranscriptionJob = {
      id: Date.now().toString(),
      title: title.trim(),
      status: 'pending',
      progress: 0,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      createdAt: new Date()
    };

    setJobs(prev => [newJob, ...prev]);

    // Mock upload process
    setTimeout(() => {
      setJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { ...job, status: 'processing', progress: 25 }
          : job
      ));
    }, 1000);

    setTimeout(() => {
      setJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { ...job, progress: 75 }
          : job
      ));
    }, 3000);

    setTimeout(() => {
      setJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { 
              ...job, 
              status: 'completed', 
              progress: 100, 
              completedAt: new Date(),
              speakerCount: 2,
              duration: 1800,
              transcriptionId: `trans_${newJob.id}`
            }
          : job
      ));
    }, 5000);

    setIsUploading(false);
    setSelectedFile(null);
    setTitle('');
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Mic className="w-4 h-4 animate-pulse" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <FileAudio className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gradient">Transkrypcja Audio</h2>
          <p className="text-muted-foreground mt-2">Przekształć nagrania w przeszukiwalny tekst z rozpoznawaniem mówców</p>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Nowa Transkrypcja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tytuł transkrypcji</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Wprowadź opisowy tytuł..."
                className="w-full p-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Plik audio</label>
              <div className="relative">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="audio-upload"
                />
                <label
                  htmlFor="audio-upload"
                  className="w-full p-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
                >
                  <FileAudio className="w-5 h-5 text-muted-foreground" />
                  {selectedFile ? selectedFile.name : 'Wybierz plik audio'}
                </label>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="p-4 bg-background/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{selectedFile.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Rozmiar: {formatFileSize(selectedFile.size)}
                  </div>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !title.trim()}
                  variant="gradient"
                  className="hover-scale"
                >
                  {isUploading ? 'Przesyłanie...' : 'Rozpocznij Transkrypcję'}
                </Button>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <strong>Obsługiwane formaty:</strong> MP3, WAV, M4A, FLAC | 
            <strong> Maksymalny rozmiar:</strong> 500 MB |
            <strong> Jakość:</strong> Automatyczne rozpoznawanie mówców z diarization
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id} className="glass-effect hover-scale transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`${getStatusColor(job.status)}`}>
                      {getStatusIcon(job.status)}
                    </div>
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(job.status)} bg-current bg-opacity-20`}>
                      {job.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Plik:</span>
                      <div className="font-medium">{job.fileName}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rozmiar:</span>
                      <div className="font-medium">{formatFileSize(job.fileSize)}</div>
                    </div>
                    {job.duration && (
                      <div>
                        <span className="text-muted-foreground">Czas trwania:</span>
                        <div className="font-medium">{formatDuration(job.duration)}</div>
                      </div>
                    )}
                    {job.speakerCount && (
                      <div>
                        <span className="text-muted-foreground">Mówcy:</span>
                        <div className="font-medium flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {job.speakerCount}
                        </div>
                      </div>
                    )}
                  </div>

                  {job.status === 'processing' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Postęp transkrypcji</span>
                        <span>{job.progress}%</span>
                      </div>
                      <div className="w-full bg-background/30 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Utworzone: {job.createdAt.toLocaleString()}
                      {job.completedAt && (
                        <span> | Zakończone: {job.completedAt.toLocaleString()}</span>
                      )}
                    </div>

                    {job.status === 'completed' && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="hover-scale">
                          <Play className="w-3 h-3 mr-1" />
                          Odtwórz
                        </Button>
                        <Button variant="outline" size="sm" className="hover-scale">
                          <Download className="w-3 h-3 mr-1" />
                          Pobierz
                        </Button>
                        <Button variant="neural" size="sm" className="hover-scale">
                          Zobacz Transkrypcję
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {jobs.length === 0 && (
          <Card className="glass-effect">
            <CardContent className="text-center py-12">
              <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Brak transkrypcji</h3>
              <p className="text-muted-foreground">
                Prześlij plik audio, aby rozpocząć automatyczną transkrypcję z rozpoznawaniem mówców.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AudioTranscription;