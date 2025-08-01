import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthWrapper';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Clock, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';

interface Order {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ClientDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać zleceń",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'NEW':
        return { 
          label: 'Nowe', 
          variant: 'secondary' as const,
          icon: FileText,
          color: 'text-blue-600'
        };
      case 'IN_PROGRESS':
        return { 
          label: 'W trakcie analizy', 
          variant: 'default' as const,
          icon: Clock,
          color: 'text-yellow-600'
        };
      case 'AWAITING_CLIENT':
        return { 
          label: 'Oczekuje uzupełnienia', 
          variant: 'destructive' as const,
          icon: AlertCircle,
          color: 'text-orange-600'
        };
      case 'AWAITING_PAYMENT':
        return { 
          label: 'Gotowe do opłaty', 
          variant: 'outline' as const,
          icon: CreditCard,
          color: 'text-green-600'
        };
      case 'COMPLETED':
        return { 
          label: 'Zakończone', 
          variant: 'secondary' as const,
          icon: CheckCircle,
          color: 'text-green-600'
        };
      default:
        return { 
          label: status, 
          variant: 'secondary' as const,
          icon: FileText,
          color: 'text-gray-600'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Moje Zlecenia</h1>
          <p className="text-muted-foreground mt-1">
            Zarządzaj swoimi zleceniami analizy dokumentów
          </p>
        </div>
        <Button asChild>
          <Link to="/create-order">
            <Plus className="h-4 w-4 mr-2" />
            Nowe Zlecenie
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Brak zleceń</h3>
            <p className="text-muted-foreground text-center mb-4">
              Nie masz jeszcze żadnych zleceń. Utwórz pierwsze zlecenie, aby rozpocząć.
            </p>
            <Button asChild>
              <Link to="/create-order">
                <Plus className="h-4 w-4 mr-2" />
                Utwórz pierwsze zlecenie
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{order.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {order.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Utworzone: {new Date(order.created_at).toLocaleDateString('pl-PL')}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/order/${order.id}`}>
                        Zobacz szczegóły
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}