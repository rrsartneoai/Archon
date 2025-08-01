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
import { Search, Plus, Phone, Mail, User, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  pesel: string;
  notes: string;
  created_at: string;
}

const ClientsManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    pesel: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm)
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

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
        .select('*')
        .eq('law_firm_id', profile.law_firm_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać listy klientów.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
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

      const { error } = await supabase
        .from('clients')
        .insert([{
          ...newClient,
          law_firm_id: profile.law_firm_id
        }]);

      if (error) throw error;

      toast({
        title: "Sukces",
        description: "Klient został dodany pomyślnie."
      });

      setIsAddDialogOpen(false);
      setNewClient({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        date_of_birth: '',
        pesel: '',
        notes: ''
      });
      fetchClients();
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać klienta.",
        variant: "destructive"
      });
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
          <h1 className="text-3xl font-bold tracking-tight">Zarządzanie Klientami</h1>
          <p className="text-muted-foreground">
            Przeglądaj i zarządzaj bazą klientów kancelarii
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Dodaj Klienta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Dodaj nowego klienta</DialogTitle>
              <DialogDescription>
                Wprowadź dane nowego klienta do systemu kancelarii.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Imię *</Label>
                  <Input
                    id="first_name"
                    value={newClient.first_name}
                    onChange={(e) => setNewClient({...newClient, first_name: e.target.value})}
                    placeholder="Jan"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nazwisko *</Label>
                  <Input
                    id="last_name"
                    value={newClient.last_name}
                    onChange={(e) => setNewClient({...newClient, last_name: e.target.value})}
                    placeholder="Kowalski"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    placeholder="jan.kowalski@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    placeholder="+48 123 456 789"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                  placeholder="ul. Przykładowa 1, 00-000 Warszawa"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_of_birth">Data urodzenia</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={newClient.date_of_birth}
                    onChange={(e) => setNewClient({...newClient, date_of_birth: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="pesel">PESEL</Label>
                  <Input
                    id="pesel"
                    value={newClient.pesel}
                    onChange={(e) => setNewClient({...newClient, pesel: e.target.value})}
                    placeholder="12345678901"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notatki</Label>
                <Textarea
                  id="notes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                  placeholder="Dodatkowe informacje o kliencie..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Anuluj
              </Button>
              <Button 
                onClick={handleAddClient}
                disabled={!newClient.first_name || !newClient.last_name}
              >
                Dodaj Klienta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj klientów..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="secondary">
          {filteredClients.length} klientów
        </Badge>
      </div>

      {/* Clients Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {client.first_name} {client.last_name}
              </CardTitle>
              <CardDescription>
                Klient od {new Date(client.created_at).toLocaleDateString('pl-PL')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {client.email}
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {client.phone}
                </div>
              )}
              {client.date_of_birth && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(client.date_of_birth).toLocaleDateString('pl-PL')}
                </div>
              )}
              {client.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {client.notes}
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

      {filteredClients.length === 0 && (
        <div className="text-center py-10">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-muted-foreground">Brak klientów</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? 'Brak klientów spełniających kryteria wyszukiwania.' : 'Rozpocznij od dodania pierwszego klienta.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientsManagement;