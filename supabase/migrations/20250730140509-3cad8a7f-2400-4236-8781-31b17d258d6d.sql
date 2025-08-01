-- Rozszerzenie istniejącego typu user_role o nowe role dla systemu zleceń
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'client';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operator';

-- Dodanie nowych statusów dla zleceń
CREATE TYPE order_status AS ENUM (
  'new',
  'in_progress', 
  'awaiting_client',
  'awaiting_payment',
  'completed',
  'cancelled'
);

-- Dodanie statusów płatności
CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'cancelled'
);

-- Tabela zleceń analizy dokumentów
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status order_status NOT NULL DEFAULT 'new',
  price DECIMAL(10,2) DEFAULT 299.00, -- Domyślna cena analizy
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela dokumentów wgranych do zleceń
CREATE TABLE public.order_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela analiz przygotowanych przez operatorów
CREATE TABLE public.order_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  preview_content TEXT, -- Fragment widoczny przed płatnością
  full_content TEXT NOT NULL, -- Pełna treść analizy
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela płatności za analizy
CREATE TABLE public.order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PLN',
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela komentarzy/komunikacji w ramach zlecenia
CREATE TABLE public.order_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Czy komentarz tylko dla operatorów
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Włączenie RLS na wszystkich tabelach
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_comments ENABLE ROW LEVEL SECURITY;

-- Polityki RLS dla orders
CREATE POLICY "Clients can view their own orders" ON public.orders
  FOR SELECT USING (
    client_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Operators can view all orders" ON public.orders
  FOR SELECT USING (
    get_user_role(auth.uid()) = ANY(ARRAY['operator'::user_role, 'admin'::user_role])
  );

CREATE POLICY "Clients can create orders" ON public.orders
  FOR INSERT WITH CHECK (
    client_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND
    get_user_role(auth.uid()) = ANY(ARRAY['client'::user_role, 'admin'::user_role])
  );

CREATE POLICY "Operators can update orders" ON public.orders
  FOR UPDATE USING (
    get_user_role(auth.uid()) = ANY(ARRAY['operator'::user_role, 'admin'::user_role])
  );

-- Polityki RLS dla order_documents
CREATE POLICY "Order participants can view documents" ON public.order_documents
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE 
        client_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
        get_user_role(auth.uid()) = ANY(ARRAY['operator'::user_role, 'admin'::user_role])
    )
  );

CREATE POLICY "Clients can upload documents to their orders" ON public.order_documents
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE 
        client_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Operators can manage all documents" ON public.order_documents
  FOR ALL USING (
    get_user_role(auth.uid()) = ANY(ARRAY['operator'::user_role, 'admin'::user_role])
  );

-- Polityki RLS dla order_analyses
CREATE POLICY "Order participants can view analyses" ON public.order_analyses
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE 
        client_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
        get_user_role(auth.uid()) = ANY(ARRAY['operator'::user_role, 'admin'::user_role])
    )
  );

CREATE POLICY "Operators can manage analyses" ON public.order_analyses
  FOR ALL USING (
    get_user_role(auth.uid()) = ANY(ARRAY['operator'::user_role, 'admin'::user_role])
  );

-- Polityki RLS dla order_payments
CREATE POLICY "Order participants can view payments" ON public.order_payments
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE 
        client_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
        get_user_role(auth.uid()) = ANY(ARRAY['operator'::user_role, 'admin'::user_role])
    )
  );

CREATE POLICY "System can manage payments" ON public.order_payments
  FOR ALL USING (true);

-- Polityki RLS dla order_comments  
CREATE POLICY "Order participants can view non-internal comments" ON public.order_comments
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE 
        client_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
        get_user_role(auth.uid()) = ANY(ARRAY['operator'::user_role, 'admin'::user_role])
    ) AND (
      NOT is_internal OR 
      get_user_role(auth.uid()) = ANY(ARRAY['operator'::user_role, 'admin'::user_role])
    )
  );

CREATE POLICY "Order participants can create comments" ON public.order_comments
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE 
        client_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
        get_user_role(auth.uid()) = ANY(ARRAY['operator'::user_role, 'admin'::user_role])
    ) AND
    author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Triggery do automatycznych aktualizacji updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_analyses_updated_at
  BEFORE UPDATE ON public.order_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_payments_updated_at
  BEFORE UPDATE ON public.order_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indeksy dla lepszej wydajności
CREATE INDEX idx_orders_client_id ON public.orders(client_id);
CREATE INDEX idx_orders_operator_id ON public.orders(operator_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_order_documents_order_id ON public.order_documents(order_id);
CREATE INDEX idx_order_payments_order_id ON public.order_payments(order_id);
CREATE INDEX idx_order_payments_stripe_session_id ON public.order_payments(stripe_session_id);
CREATE INDEX idx_order_comments_order_id ON public.order_comments(order_id);

-- Bucket dla dokumentów zleceń
INSERT INTO storage.buckets (id, name, public) 
VALUES ('order-documents', 'order-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Polityki storage dla dokumentów zleceń
CREATE POLICY "Order participants can view documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'order-documents' AND
    name LIKE (auth.uid()::text || '/%')
  );

CREATE POLICY "Authenticated users can upload order documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'order-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their order documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'order-documents' AND
    name LIKE (auth.uid()::text || '/%')
  );

CREATE POLICY "Users can delete their order documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'order-documents' AND
    name LIKE (auth.uid()::text || '/%')
  );