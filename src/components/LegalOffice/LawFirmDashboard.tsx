import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, FileText, TrendingUp, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalClients: number;
  activeCases: number;
  pendingCases: number;
  totalDocuments: number;
}

interface LawFirm {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

const LawFirmDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeCases: 0,
    pendingCases: 0,
    totalDocuments: 0
  });
  const [lawFirm, setLawFirm] = useState<LawFirm | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get user's profile to find law firm
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('law_firm_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.law_firm_id) {
        toast({
          title: "Brak kancelarii",
          description: "Nie jesteś przypisany do żadnej kancelarii.",
          variant: "destructive"
        });
        return;
      }

      // Get law firm details
      const { data: firmData } = await supabase
        .from('law_firms')
        .select('*')
        .eq('id', profile.law_firm_id)
        .single();

      if (firmData) {
        setLawFirm(firmData);
      }

      // Get dashboard statistics
      const [clientsResult, casesResult, documentsResult] = await Promise.all([
        supabase
          .from('clients')
          .select('id', { count: 'exact' })
          .eq('law_firm_id', profile.law_firm_id),
        supabase
          .from('cases')
          .select('id, status', { count: 'exact' })
          .eq('law_firm_id', profile.law_firm_id),
        supabase
          .from('documents')
          .select('id', { count: 'exact' })
          .in('case_id', (await supabase
            .from('cases')
            .select('id')
            .eq('law_firm_id', profile.law_firm_id)).data?.map(c => c.id) || [])
      ]);

      const activeCases = casesResult.data?.filter(c => c.status === 'active').length || 0;
      const pendingCases = casesResult.data?.filter(c => c.status === 'pending').length || 0;

      setStats({
        totalClients: clientsResult.count || 0,
        activeCases,
        pendingCases,
        totalDocuments: documentsResult.count || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać danych dashboardu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold tracking-tight">Panel Główny</h1>
          {lawFirm && (
            <p className="text-muted-foreground">
              {lawFirm.name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/clients/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nowy Klient
          </Button>
          <Button onClick={() => navigate('/cases/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nowa Sprawa
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Łączna liczba klientów</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Wszyscy klienci kancelarii
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktywne sprawy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCases}</div>
            <p className="text-xs text-muted-foreground">
              Sprawy w trakcie realizacji
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sprawy oczekujące</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCases}</div>
            <p className="text-xs text-muted-foreground">
              Sprawy do rozpoczęcia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dokumenty</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Łączna liczba dokumentów
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/clients')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Zarządzanie Klientami
            </CardTitle>
            <CardDescription>
              Przeglądaj i zarządzaj bazą klientów
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/cases')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sprawy Prawne
            </CardTitle>
            <CardDescription>
              Monitoruj postęp wszystkich spraw
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/documents')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dokumenty
            </CardTitle>
            <CardDescription>
              Przeglądaj i zarządzaj dokumentami
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Law Firm Info */}
      {lawFirm && (
        <Card>
          <CardHeader>
            <CardTitle>Informacje o kancelarii</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Nazwa:</p>
                <p className="text-muted-foreground">{lawFirm.name}</p>
              </div>
              <div>
                <p className="font-medium">Email:</p>
                <p className="text-muted-foreground">{lawFirm.email || 'Nie podano'}</p>
              </div>
              <div>
                <p className="font-medium">Telefon:</p>
                <p className="text-muted-foreground">{lawFirm.phone || 'Nie podano'}</p>
              </div>
              <div>
                <p className="font-medium">Adres:</p>
                <p className="text-muted-foreground">{lawFirm.address || 'Nie podano'}</p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => navigate('/settings')}>
                Edytuj dane kancelarii
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LawFirmDashboard;