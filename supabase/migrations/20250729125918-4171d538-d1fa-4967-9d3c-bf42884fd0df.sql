-- Create enum types for better data integrity
CREATE TYPE public.case_status AS ENUM ('active', 'pending', 'closed', 'archived');
CREATE TYPE public.case_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.user_role AS ENUM ('admin', 'lawyer', 'client', 'staff');

-- Create law firms table (kancelarie)
CREATE TABLE public.law_firms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    tax_id TEXT, -- NIP
    registration_number TEXT, -- KRS
    website TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for extended user information
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'client',
    law_firm_id UUID REFERENCES public.law_firms(id) ON DELETE SET NULL,
    specialization TEXT,
    license_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Create clients table (klienci)
CREATE TABLE public.clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    law_firm_id UUID NOT NULL REFERENCES public.law_firms(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    date_of_birth DATE,
    pesel TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cases table (sprawy)
CREATE TABLE public.cases (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    law_firm_id UUID NOT NULL REFERENCES public.law_firms(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    assigned_lawyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    case_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    case_type TEXT,
    status case_status NOT NULL DEFAULT 'pending',
    priority case_priority NOT NULL DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    court_name TEXT,
    case_value DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(law_firm_id, case_number)
);

-- Create documents table for case files
CREATE TABLE public.documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    description TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case notes table
CREATE TABLE public.case_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function to get user's law firm
CREATE OR REPLACE FUNCTION public.get_user_law_firm(user_uuid UUID)
RETURNS UUID AS $$
    SELECT law_firm_id FROM public.profiles WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for law_firms
CREATE POLICY "Users can view their law firm" ON public.law_firms
    FOR SELECT USING (
        id = public.get_user_law_firm(auth.uid()) OR 
        public.get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can insert law firms" ON public.law_firms
    FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins and lawyers can update their law firm" ON public.law_firms
    FOR UPDATE USING (
        id = public.get_user_law_firm(auth.uid()) AND 
        public.get_user_role(auth.uid()) IN ('admin', 'lawyer')
    );

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their law firm" ON public.profiles
    FOR SELECT USING (
        law_firm_id = public.get_user_law_firm(auth.uid()) OR
        user_id = auth.uid() OR
        public.get_user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for clients
CREATE POLICY "Law firm members can view clients" ON public.clients
    FOR SELECT USING (
        law_firm_id = public.get_user_law_firm(auth.uid()) OR
        user_id = auth.uid()
    );

CREATE POLICY "Lawyers can manage clients" ON public.clients
    FOR ALL USING (
        law_firm_id = public.get_user_law_firm(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('admin', 'lawyer')
    );

-- RLS Policies for cases
CREATE POLICY "Law firm members can view cases" ON public.cases
    FOR SELECT USING (
        law_firm_id = public.get_user_law_firm(auth.uid()) OR
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    );

CREATE POLICY "Lawyers can manage cases" ON public.cases
    FOR ALL USING (
        law_firm_id = public.get_user_law_firm(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('admin', 'lawyer')
    );

-- RLS Policies for documents
CREATE POLICY "Case participants can view documents" ON public.documents
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM public.cases 
            WHERE law_firm_id = public.get_user_law_firm(auth.uid()) OR
            client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Lawyers can manage documents" ON public.documents
    FOR ALL USING (
        case_id IN (
            SELECT id FROM public.cases 
            WHERE law_firm_id = public.get_user_law_firm(auth.uid()) AND
            public.get_user_role(auth.uid()) IN ('admin', 'lawyer')
        )
    );

-- RLS Policies for case_notes
CREATE POLICY "Case participants can view non-private notes" ON public.case_notes
    FOR SELECT USING (
        (NOT is_private OR author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())) AND
        case_id IN (
            SELECT id FROM public.cases 
            WHERE law_firm_id = public.get_user_law_firm(auth.uid()) OR
            client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Lawyers can manage case notes" ON public.case_notes
    FOR ALL USING (
        case_id IN (
            SELECT id FROM public.cases 
            WHERE law_firm_id = public.get_user_law_firm(auth.uid()) AND
            public.get_user_role(auth.uid()) IN ('admin', 'lawyer')
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_law_firm_id ON public.profiles(law_firm_id);
CREATE INDEX idx_clients_law_firm_id ON public.clients(law_firm_id);
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_cases_law_firm_id ON public.cases(law_firm_id);
CREATE INDEX idx_cases_client_id ON public.cases(client_id);
CREATE INDEX idx_cases_assigned_lawyer_id ON public.cases(assigned_lawyer_id);
CREATE INDEX idx_documents_case_id ON public.documents(case_id);
CREATE INDEX idx_case_notes_case_id ON public.case_notes(case_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_law_firms_updated_at
    BEFORE UPDATE ON public.law_firms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON public.cases
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_case_notes_updated_at
    BEFORE UPDATE ON public.case_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'client')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();