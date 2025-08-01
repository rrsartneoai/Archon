-- Step 2: Create order status and payment status enums
CREATE TYPE public.order_status AS ENUM ('pending', 'in_progress', 'awaiting_payment', 'completed', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  operator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  amount INTEGER, -- Amount in cents
  currency TEXT DEFAULT 'pln',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order_documents table
CREATE TABLE public.order_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order_analyses table
CREATE TABLE public.order_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  operator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order_payments table
CREATE TABLE public.order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  stripe_session_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'pln',
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order_comments table
CREATE TABLE public.order_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false, -- true for operator-only comments
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders table
CREATE POLICY "Clients can view their own orders" ON public.orders
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clients can create orders" ON public.orders
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Operators can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('operator', 'admin')
    )
  );

CREATE POLICY "Operators can update orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('operator', 'admin')
    )
  );

-- RLS Policies for order_documents table
CREATE POLICY "Clients can view documents for their orders" ON public.order_documents
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE client_id = auth.uid())
  );

CREATE POLICY "Clients can upload documents to their orders" ON public.order_documents
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE client_id = auth.uid())
  );

CREATE POLICY "Operators can view all order documents" ON public.order_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('operator', 'admin')
    )
  );

-- RLS Policies for order_analyses table
CREATE POLICY "Clients can view analyses for their orders" ON public.order_analyses
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE client_id = auth.uid())
  );

CREATE POLICY "Operators can manage analyses" ON public.order_analyses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('operator', 'admin')
    )
  );

-- RLS Policies for order_payments table
CREATE POLICY "Clients can view payments for their orders" ON public.order_payments
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE client_id = auth.uid())
  );

CREATE POLICY "Operators can view all payments" ON public.order_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('operator', 'admin')
    )
  );

CREATE POLICY "System can manage payments" ON public.order_payments
  FOR ALL USING (true);

-- RLS Policies for order_comments table
CREATE POLICY "Clients can view non-internal comments for their orders" ON public.order_comments
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE client_id = auth.uid())
    AND is_internal = false
  );

CREATE POLICY "Clients can add comments to their orders" ON public.order_comments
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE client_id = auth.uid())
    AND author_id = auth.uid()
    AND is_internal = false
  );

CREATE POLICY "Operators can view all comments" ON public.order_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('operator', 'admin')
    )
  );

CREATE POLICY "Operators can add comments" ON public.order_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('operator', 'admin')
    )
    AND author_id = auth.uid()
  );

-- Create updated_at triggers
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

-- Create storage bucket for order documents
INSERT INTO storage.buckets (id, name, public) VALUES ('order-documents', 'order-documents', false);

-- Storage policies for order documents
CREATE POLICY "Clients can upload documents to their orders" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'order-documents' 
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.orders WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view documents from their orders" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'order-documents' 
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.orders WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Operators can view all order documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'order-documents' 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('operator', 'admin')
    )
  );