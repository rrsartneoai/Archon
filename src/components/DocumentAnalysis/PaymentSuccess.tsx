import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText, ArrowLeft } from 'lucide-react';

export default function PaymentSuccess() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardContent className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Płatność zakończona pomyślnie!</h1>
          <p className="text-muted-foreground mb-8">
            Dziękujemy za dokonanie płatności. Twoje zlecenie zostało opłacone i masz teraz dostęp do pełnej analizy dokumentów.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/dashboard">
                <FileText className="h-4 w-4 mr-2" />
                Zobacz swoje zlecenia
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/create-order">
                Utwórz nowe zlecenie
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Co dalej?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Dostęp do analizy</h3>
              <p className="text-sm text-muted-foreground">
                Masz teraz pełny dostęp do swojej analizy dokumentów. Możesz ją przeglądać w dowolnym momencie.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Historia zleceń</h3>
              <p className="text-sm text-muted-foreground">
                Wszystkie Twoje zlecenia i analizy są dostępne w panelu klienta przez 12 miesięcy.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <ArrowLeft className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Potrzebujesz pomocy?</h3>
              <p className="text-sm text-muted-foreground">
                Jeśli masz pytania dotyczące analizy, możesz dodać komentarz do zlecenia.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}