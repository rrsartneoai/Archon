import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  Users,
  BarChart3,
  DollarSign
} from 'lucide-react';

interface Order {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  client_email?: string;
}

interface Stats {
  total: number;
  new: number;
  inProgress: number;
  awaitingClient: number;
  awaitingPayment: number;
  completed: number;
}

export default function OperatorDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    new: 0,
    inProgress: 0,
    awaitingClient: 0,
    awaitingPayment: 0,
    completed: 0
  });
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Fetch orders with client information
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_client_id_fkey (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const ordersWithEmail = ordersData?.map(order => ({
        ...order,
        client_email: order.profiles?.email
      })) || [];

      setOrders(ordersWithEmail);

      // Calculate stats
      const newStats = ordersWithEmail.reduce((acc, order) => {
        acc.total++;
        switch (order.status) {
          case 'NEW':
            acc.new++;
            break;
          case 'IN_PROGRESS':
            acc.inProgress++;
            break;
          case 'AWAITING_CLIENT':
            acc.awaitingClient++;
            break;
          case 'AWAITING_PAYMENT':
            acc.awaitingPayment++;
            break;
          case 'COMPLETED':
            acc.completed++;
            break;
        }
        return acc;
      }, {
        total: 0,
        new: 0,
        inProgress: 0,
        awaitingClient: 0,
        awaitingPayment: 0,
        completed: 0
      });

      setStats(newStats);
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

  const filteredOrders = filter === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === filter);

  const statCards = [
    {
      title: "Wszystkie zlecenia",
      value: stats.total,
      icon: BarChart3,
      color: "text-blue-600"
    },
    {
      title: "Nowe zlecenia",
      value: stats.new,
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "W trakcie",
      value: stats.inProgress,
      icon: Clock,
      color: "text-yellow-600"
    },
    {
      title: "Do opłaty",
      value: stats.awaitingPayment,
      icon: DollarSign,
      color: "text-green-600"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel Operatora</h1>
        <p className="text-muted-foreground mt-1">
          Zarządzaj zleceniami i monitoruj postęp prac
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Orders Management */}
      <Card>
        <CardHeader>
          <CardTitle>Zlecenia</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="ALL">Wszystkie ({stats.total})</TabsTrigger>
              <TabsTrigger value="NEW">Nowe ({stats.new})</TabsTrigger>
              <TabsTrigger value="IN_PROGRESS">W trakcie ({stats.inProgress})</TabsTrigger>
              <TabsTrigger value="AWAITING_CLIENT">Oczekuje ({stats.awaitingClient})</TabsTrigger>
              <TabsTrigger value="AWAITING_PAYMENT">Do opłaty ({stats.awaitingPayment})</TabsTrigger>
              <TabsTrigger value="COMPLETED">Zakończone ({stats.completed})</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-6">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Brak zleceń w tej kategorii
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <Card key={order.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold">{order.title}</h3>
                                <div className="flex items-center gap-2">
                                  <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                                  <Badge variant={statusInfo.variant}>
                                    {statusInfo.label}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                                {order.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Klient: {order.client_email}</span>
                                <span>
                                  Utworzone: {new Date(order.created_at).toLocaleDateString('pl-PL')}
                                </span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/order/${order.id}`}>
                                Obsłuż zlecenie
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}