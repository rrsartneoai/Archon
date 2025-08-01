import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthWrapper';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, Info } from 'lucide-react';

export default function CreateOrder() {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title.trim()) {
      toast({
        title: "Błąd",
        description: "Tytuł zlecenia jest wymagany",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            client_id: user.id,
            title: formData.title.trim(),
            description: formData.description.trim(),
            status: 'NEW'
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Upload files if any
      if (files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${orderData.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Save document record
          return supabase
            .from('documents')
            .insert([
              {
                order_id: orderData.id,
                file_name: file.name,
                file_path: fileName,
                uploaded_by: user.id
              }
            ]);
        });

        await Promise.all(uploadPromises);
      }

      toast({
        title: "Sukces",
        description: "Zlecenie zostało utworzone pomyślnie",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć zlecenia",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nowe Zlecenie</h1>
        <p className="text-muted-foreground mt-1">
          Utwórz nowe zlecenie analizy dokumentów
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Szczegóły Zlecenia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Tytuł zlecenia *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="np. Analiza umowy najmu lokalu handlowego"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Opis zlecenia</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Opisz szczegółowo, jakiego rodzaju analizy oczekujesz..."
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <Label>Dokumenty</Label>
              
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Przeciągnij pliki tutaj lub kliknij, aby wybrać
                  </p>
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="max-w-xs mx-auto"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    Obsługiwane formaty: PDF, DOC, DOCX, TXT, JPG, PNG
                  </p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Wybrane pliki:</h3>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={uploading}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Tworzenie...' : 'Utwórz Zlecenie'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold">Jak przebiega proces analizy?</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Złożenie zlecenia z opisem i dokumentami</li>
                <li>Operator sprawdza kompletność dokumentacji</li>
                <li>W razie potrzeby otrzymasz prośbę o uzupełnienie</li>
                <li>Operator przeprowadza analizę dokumentów</li>
                <li>Otrzymasz zapowiedź analizy i link do płatności</li>
                <li>Po opłaceniu otrzymasz pełną analizę</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}