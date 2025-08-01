import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, FileText, Calendar, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Case {
  id: string;
  case_number: string;
  title: string;
  description: string;
  case_type: string;
  status: 'active' | 'pending' | 'closed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date: string;
  end_date: string;
  court_name: string;
  case_value: number;
  created_at: string;
  client: {
    first_name: string;
    last_name: string;
  };
  assigned_lawyer: {
    first_name: string;
    last_name: string;
  } | null;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

interface Lawyer {
  id: string;
  first_name: string;
  last_name: string;
}

const CasesManagement = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCase, setNewCase] = useState({
    case_number: '',
    title: '',
    description: '',
    case_type: '',
    status: 'pending' as const,
    priority: 'medium' as const,
    start_date: '',
    end_date: '',
    court_name: '',
    case_value: '',
    client_id: '',
    assigned_lawyer_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCases();
    fetchClients();
    fetchLawyers();
  }, []);

  useEffect(() => {
    let filtered = cases.filter(case_ =>
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${case_.client.first_name} ${case_.client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(case_ => case_.status === statusFilter);
    }

    setFilteredCases(filtered);
  }, [cases, searchTerm, statusFilter]);

  const fetchCases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('law_firm_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.law_firm_id) return;

      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          client:clients(first_name, last_name),
          assigned_lawyer:profiles(first_name, last_name)
        `)
        .eq('law_firm_id', profile.law_firm_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać listy spraw.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('law_firm_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.law_firm_id) return;

      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('law_firm_id', profile.law_firm_id);

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchLawyers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('law_firm_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.law_firm_id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('law_firm_id', profile.law_firm_id)
        .in('role', ['lawyer', 'admin']);

      if (error) throw error;
      setLawyers(data || []);
    } catch (error) {
      console.error('Error fetching lawyers:', error);
    }
  };

  const generateCaseNumber = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${year}/${randomNum}`;
  };

  const handleAddCase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('law_firm_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.law_firm_id) {
        toast({
          title: "Błąd",
          description: "Nie jesteś przypisany do kancelarii.",
          variant: "destructive"
        });
        return;
      }

      const caseData = {
        ...newCase,
        law_firm_id: profile.law_firm_id,
        case_value: newCase.case_value ? parseFloat(newCase.case_value) : null,
        case_number: newCase.case_number || generateCaseNumber(),
        assigned_lawyer_id: newCase.assigned_lawyer_id || null
      };

      const { error } = await supabase
        .from('cases')
        .insert([caseData]);

      if (error) throw error;

      toast({
        title: "Sukces",
        description: "Sprawa została dodana pomyślnie."
      });

      setIsAddDialogOpen(false);
      setNewCase({
        case_number: '',
        title: '',
        description: '',
        case_type: '',
        status: 'pending',
        priority: 'medium',
        start_date: '',
        end_date: '',
        court_name: '',
        case_value: '',
        client_id: '',
        assigned_lawyer_id: ''
      });
      fetchCases();
    } catch (error) {
      console.error('Error adding case:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać sprawy.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'closed': return 'bg-blue-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktywna';
      case 'pending': return 'Oczekująca';
      case 'closed': return 'Zamknięta';
      case 'archived': return 'Archiwalna';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Pilna';
      case 'high': return 'Wysoka';
      case 'medium': return 'Średnia';
      case 'low': return 'Niska';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zarządzanie Sprawami</h1>
          <p className="text-muted-foreground">
            Monitoruj i zarządzaj wszystkimi sprawami prawymi
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Dodaj Sprawę
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Dodaj nową sprawę</DialogTitle>
              <DialogDescription>
                Wprowadź dane nowej sprawy do systemu kancelarii.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="case_number">Numer sprawy</Label>
                  <Input
                    id="case_number"
                    value={newCase.case_number}
                    onChange={(e) => setNewCase({...newCase, case_number: e.target.value})}
                    placeholder={generateCaseNumber()}
                  />
                </div>
                <div>
                  <Label htmlFor="title">Tytuł sprawy *</Label>
                  <Input
                    id="title"
                    value={newCase.title}
                    onChange={(e) => setNewCase({...newCase, title: e.target.value})}
                    placeholder="Np. Sprawa rozwodowa"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Opis sprawy</Label>
                <Textarea
                  id="description"
                  value={newCase.description}
                  onChange={(e) => setNewCase({...newCase, description: e.target.value})}
                  placeholder="Szczegółowy opis sprawy..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="case_type">Typ sprawy</Label>
                  <Input
                    id="case_type"
                    value={newCase.case_type}
                    onChange={(e) => setNewCase({...newCase, case_type: e.target.value})}
                    placeholder="Np. Prawo rodzinne"
                  />
                </div>
                <div>
                  <Label htmlFor="court_name">Nazwa sądu</Label>
                  <Input
                    id="court_name"
                    value={newCase.court_name}
                    onChange={(e) => setNewCase({...newCase, court_name: e.target.value})}
                    placeholder="Np. Sąd Rejonowy w Warszawie"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={newCase.status} onValueChange={(value: any) => setNewCase({...newCase, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Oczekująca</SelectItem>
                      <SelectItem value="active">Aktywna</SelectItem>
                      <SelectItem value="closed">Zamknięta</SelectItem>
                      <SelectItem value="archived">Archiwalna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priorytet</Label>
                  <Select value={newCase.priority} onValueChange={(value: any) => setNewCase({...newCase, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niska</SelectItem>
                      <SelectItem value="medium">Średnia</SelectItem>
                      <SelectItem value="high">Wysoka</SelectItem>
                      <SelectItem value="urgent">Pilna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="case_value">Wartość sprawy (PLN)</Label>
                  <Input
                    id="case_value"
                    type="number"
                    value={newCase.case_value}
                    onChange={(e) => setNewCase({...newCase, case_value: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Data rozpoczęcia</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newCase.start_date}
                    onChange={(e) => setNewCase({...newCase, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Data zakończenia</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newCase.end_date}
                    onChange={(e) => setNewCase({...newCase, end_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_id">Klient *</Label>
                  <Select value={newCase.client_id} onValueChange={(value) => setNewCase({...newCase, client_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz klienta" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assigned_lawyer_id">Przypisany prawnik</Label>
                  <Select value={newCase.assigned_lawyer_id} onValueChange={(value) => setNewCase({...newCase, assigned_lawyer_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz prawnika" />
                    </SelectTrigger>
                    <SelectContent>
                      {lawyers.map((lawyer) => (
                        <SelectItem key={lawyer.id} value={lawyer.id}>
                          {lawyer.first_name} {lawyer.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Anuluj
              </Button>
              <Button 
                onClick={handleAddCase}
                disabled={!newCase.title || !newCase.client_id}
              >
                Dodaj Sprawę
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj spraw..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtruj status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="pending">Oczekujące</SelectItem>
            <SelectItem value="active">Aktywne</SelectItem>
            <SelectItem value="closed">Zamknięte</SelectItem>
            <SelectItem value="archived">Archiwalne</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">
          {filteredCases.length} spraw
        </Badge>
      </div>

      {/* Cases Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCases.map((case_) => (
          <Card key={case_.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {case_.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {case_.case_number}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge className={`${getStatusColor(case_.status)} text-white`}>
                    {getStatusLabel(case_.status)}
                  </Badge>
                  <Badge className={`${getPriorityColor(case_.priority)} text-white`}>
                    {getPriorityLabel(case_.priority)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {case_.client.first_name} {case_.client.last_name}
              </div>
              {case_.assigned_lawyer && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  {case_.assigned_lawyer.first_name} {case_.assigned_lawyer.last_name}
                </div>
              )}
              {case_.start_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(case_.start_date).toLocaleDateString('pl-PL')}
                </div>
              )}
              {case_.case_type && (
                <p className="text-sm text-muted-foreground">
                  {case_.case_type}
                </p>
              )}
              {case_.case_value && (
                <p className="text-sm font-medium">
                  Wartość: {case_.case_value.toLocaleString('pl-PL')} PLN
                </p>
              )}
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm">
                  Zobacz szczegóły
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <div className="text-center py-10">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-muted-foreground">Brak spraw</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm || statusFilter !== 'all' 
              ? 'Brak spraw spełniających kryteria wyszukiwania.' 
              : 'Rozpocznij od dodania pierwszej sprawy.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CasesManagement;