import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthWrapper';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  MessageSquare, 
  CreditCard, 
  Eye,
  Upload,
  CheckCircle
} from 'lucide-react';

interface Order {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  client_id: string;
  operator_id?: string;
  client_email?: string;
}

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  created_at: string;
}

interface Analysis {
  id: string;
  preview_content: string;
  full_content: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_email: string;
  author_role: string;
}

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchOrderDetails();
    }
  }, [id, user]);

  const fetchOrderDetails = async () => {
    try {
      // Fetch order with client info
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_client_id_fkey (
            email
          )
        `)
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

      setOrder({
        ...orderData,
        client_email: orderData.profiles?.email
      });
      setNewStatus(orderData.status);

      // Fetch documents
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('order_id', id);

      if (docsError) throw docsError;
      setDocuments(docsData || []);

      // Fetch analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from('analyses')
        .select('*')
        .eq('order_id', id)
        .single();

      if (!analysisError && analysisData) {
        setAnalysis(analysisData);
        setPreviewContent(analysisData.preview_content || '');
        setFullContent(analysisData.full_content || '');
      }

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('order_comments')
        .select(`
          *,
          profiles!order_comments_author_id_fkey (
            email,
            role
          )
        `)
        .eq('order_id', id)
        .order('created_at', { ascending: true });

      if (!commentsError && commentsData) {
        setComments(commentsData.map(comment => ({
          ...comment,
          author_email: comment.profiles?.email || 'Unknown',
          author_role: comment.profiles?.role || 'CLIENT'
        })));
      }

    } catch (error: any) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać szczegółów zlecenia",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!order || newStatus === order.status) return;

    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'IN_PROGRESS' && !order.operator_id) {
        updateData.operator_id = user?.id;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (error) throw error;

      setOrder(prev => prev ? { ...prev, status: newStatus, operator_id: updateData.operator_id || prev.operator_id } : null);
      
      toast({
        title: "Status zaktualizowany",
        description: `Status zlecenia zmieniono na: ${getStatusLabel(newStatus)}`,
      });
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować statusu",
        variant: "destructive",
      });
    }
  };

  const handleSaveAnalysis = async () => {
    if (!order || !fullContent.trim()) {
      toast({
        title: "Błąd",
        description: "Pełna treść analizy jest wymagana",
        variant: "destructive",
      });
      return;
    }

    try {
      const analysisData = {
        order_id: order.id,
        preview_content: previewContent.trim(),
        full_content: fullContent.trim()
      };

      if (analysis) {
        // Update existing analysis
        const { error } = await supabase
          .from('analyses')
          .update(analysisData)
          .eq('id', analysis.id);

        if (error) throw error;
      } else {
        // Create new analysis
        const { data, error } = await supabase
          .from('analyses')
          .insert([analysisData])
          .select()
          .single();

        if (error) throw error;
        setAnalysis(data);
      }

      // Update order status to AWAITING_PAYMENT
      await supabase
        .from('orders')
        .update({ status: 'AWAITING_PAYMENT' })
        .eq('id', order.id);

      setOrder(prev => prev ? { ...prev, status: 'AWAITING_PAYMENT' } : null);
      setNewStatus('AWAITING_PAYMENT');

      toast({
        title: "Analiza zapisana",
        description: "Analiza została zapisana. Status zlecenia zmieniono na 'Gotowe do opłaty'",
      });

    } catch (error: any) {
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać analizy",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !order) return;

    try {
      const { data, error } = await supabase
        .from('order_comments')
        .insert([
          {
            order_id: order.id,
            author_id: user?.id,
            content: newComment.trim(),
            is_private: false
          }
        ])
        .select(`
          *,
          profiles!order_comments_author_id_fkey (
            email,
            role
          )
        `)
        .single();

      if (error) throw error;

      const newCommentData = {
        ...data,
        author_email: data.profiles?.email || user?.email || 'Unknown',
        author_role: data.profiles?.role || userRole || 'CLIENT'
      };

      setComments(prev => [...prev, newCommentData]);
      setNewComment('');

      toast({
        title: "Komentarz dodany",
        description: "Twój komentarz został dodany do zlecenia",
      });

    } catch (error: any) {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać komentarza",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    // This would integrate with Stripe or other payment provider
    try {
      // Simulate payment process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error } = await supabase
        .from('orders')
        .update({ status: 'COMPLETED' })
        .eq('id', order?.id);

      if (error) throw error;

      setOrder(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
      
      toast({
        title: "Płatność zakończona",
        description: "Dziękujemy za płatność. Pełna analiza jest teraz dostępna.",
      });

    } catch (error: any) {
      toast({
        title: "Błąd płatności",
        description: "Wystąpił problem z przetworzeniem płatności",
        variant: "destructive",
      });
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error: any) {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać pliku",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'NEW': 'Nowe',
      'IN_PROGRESS': 'W trakcie analizy',
      'AWAITING_CLIENT': 'Oczekuje uzupełnienia',
      'AWAITING_PAYMENT': 'Gotowe do opłaty',
      'COMPLETED': 'Zakończone'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Zlecenie nie zostało znalezione</h2>
        <Button onClick={() => navigate('/dashboard')}>
          Powrót do dashboardu
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{order.title}</CardTitle>
              <p className="text-muted-foreground mt-1">
                Zlecenie #{order.id.slice(0, 8)}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {getStatusLabel(order.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Opis zlecenia</h3>
              <p className="text-muted-foreground">{order.description || 'Brak opisu'}</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Klient:</span> {order.client_email}</p>
              <p><span className="font-medium">Data utworzenia:</span> {new Date(order.created_at).toLocaleString('pl-PL')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dokumenty ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-muted-foreground">Brak załączonych dokumentów</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Dodano: {new Date(doc.created_at).toLocaleString('pl-PL')}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => downloadDocument(doc)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Pobierz
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operator Panel */}
      {userRole === 'OPERATOR' && (
        <Card>
          <CardHeader>
            <CardTitle>Panel Operatora</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Management */}
            <div>
              <h3 className="font-semibold mb-3">Zarządzanie statusem</h3>
              <div className="flex items-center gap-3">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">Nowe</SelectItem>
                    <SelectItem value="IN_PROGRESS">W trakcie analizy</SelectItem>
                    <SelectItem value="AWAITING_CLIENT">Oczekuje uzupełnienia</SelectItem>
                    <SelectItem value="AWAITING_PAYMENT">Gotowe do opłaty</SelectItem>
                    <SelectItem value="COMPLETED">Zakończone</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleStatusChange}
                  disabled={newStatus === order.status}
                >
                  Zaktualizuj status
                </Button>
              </div>
            </div>

            {/* Analysis Form */}
            <div>
              <h3 className="font-semibold mb-3">Analiza dokumentów</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fragment publiczny (zapowiedź)
                  </label>
                  <Textarea
                    value={previewContent}
                    onChange={(e) => setPreviewContent(e.target.value)}
                    placeholder="Wprowadź krótki fragment analizy, który będzie widoczny przed opłatą..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Pełna treść analizy *
                  </label>
                  <Textarea
                    value={fullContent}
                    onChange={(e) => setFullContent(e.target.value)}
                    placeholder="Wprowadź pełną analizę dokumentów..."
                    rows={8}
                  />
                </div>
                <Button onClick={handleSaveAnalysis}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Zapisz analizę i ustaw na "Gotowe do opłaty"
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Section for Client */}
      {userRole === 'CLIENT' && analysis && (order.status === 'AWAITING_PAYMENT' || order.status === 'COMPLETED') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Analiza dokumentów
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.status === 'AWAITING_PAYMENT' ? (
              <div className="space-y-4">
                {analysis.preview_content && (
                  <div>
                    <h3 className="font-semibold mb-2">Zapowiedź analizy</h3>
                    <div className="p-4 bg-muted rounded-md">
                      <p className="whitespace-pre-wrap">{analysis.preview_content}</p>
                    </div>
                  </div>
                )}
                <div className="text-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Analiza gotowa do opłaty</h3>
                  <p className="text-muted-foreground mb-4">
                    Opłać zlecenie, aby otrzymać dostęp do pełnej analizy dokumentów
                  </p>
                  <Button onClick={handlePayment} size="lg">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Zapłać i zobacz pełną analizę
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold mb-4">Pełna analiza dokumentów</h3>
                <div className="p-4 bg-muted rounded-md">
                  <p className="whitespace-pre-wrap">{analysis.full_content}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Komunikacja ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comments List */}
          {comments.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {comment.author_email} ({comment.author_role === 'OPERATOR' ? 'Operator' : 'Klient'})
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString('pl-PL')}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment */}
          <div className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Napisz komentarz..."
              rows={3}
            />
            <Button 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Dodaj komentarz
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}