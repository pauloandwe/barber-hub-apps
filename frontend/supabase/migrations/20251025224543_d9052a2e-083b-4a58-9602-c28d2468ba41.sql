-- Criar enum para roles (se ainda não existir)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('ADMIN', 'BARBEARIA', 'CLIENTE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de roles separada (segurança)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Migrar roles existentes da tabela profiles para user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::text::app_role FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Criar função security definer para verificar roles (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'ADMIN'
  );
$$;

-- Policy para user_roles: usuários podem ver seu próprio role
CREATE POLICY "Usuários podem ver seu próprio role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admin pode ver todos os roles
CREATE POLICY "Admin pode ver todos os roles"
ON public.user_roles FOR SELECT
USING (public.is_admin(auth.uid()));

-- Policy: Admin pode gerenciar roles
CREATE POLICY "Admin pode gerenciar roles"
ON public.user_roles FOR ALL
USING (public.is_admin(auth.uid()));

-- Atualizar trigger para criar role ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir na tabela profiles
  INSERT INTO public.profiles (id, nome, barbearia_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    (NEW.raw_user_meta_data->>'barbearia_id')::uuid
  );
  
  -- Inserir role na tabela user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'CLIENTE')
  );
  
  RETURN NEW;
END;
$$;

-- Atualizar RLS policies das outras tabelas para usar as novas funções

-- Barbearias: Admin pode gerenciar todas
DROP POLICY IF EXISTS "Admin pode gerenciar barbearias" ON public.barbearias;
CREATE POLICY "Admin pode gerenciar barbearias"
ON public.barbearias FOR ALL
USING (public.is_admin(auth.uid()));

-- Barbearias: Barbearia pode ver a sua
CREATE POLICY "Barbearia pode ver sua barbearia"
ON public.barbearias FOR SELECT
USING (
  public.has_role(auth.uid(), 'BARBEARIA') 
  AND id = (SELECT barbearia_id FROM public.profiles WHERE id = auth.uid())
);

-- Agendamentos: atualizar policies
DROP POLICY IF EXISTS "Cliente vê seus próprios agendamentos" ON public.agendamentos;
CREATE POLICY "Cliente vê seus próprios agendamentos"
ON public.agendamentos FOR SELECT
USING (
  cliente_id = auth.uid() 
  OR public.is_admin(auth.uid())
  OR (
    public.has_role(auth.uid(), 'BARBEARIA') 
    AND barbearia_id = (SELECT barbearia_id FROM public.profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Cliente pode atualizar seus agendamentos" ON public.agendamentos;
CREATE POLICY "Cliente pode atualizar seus agendamentos"
ON public.agendamentos FOR UPDATE
USING (
  cliente_id = auth.uid() 
  OR public.is_admin(auth.uid())
  OR (
    public.has_role(auth.uid(), 'BARBEARIA') 
    AND barbearia_id = (SELECT barbearia_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- Barbeiros: atualizar policies
DROP POLICY IF EXISTS "Barbearia pode gerenciar seus barbeiros" ON public.barbeiros;
CREATE POLICY "Barbearia pode gerenciar seus barbeiros"
ON public.barbeiros FOR ALL
USING (
  public.is_admin(auth.uid())
  OR (
    public.has_role(auth.uid(), 'BARBEARIA')
    AND barbearia_id = (SELECT barbearia_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- Serviços: atualizar policies
DROP POLICY IF EXISTS "Barbearia pode gerenciar seus serviços" ON public.servicos;
CREATE POLICY "Barbearia pode gerenciar seus serviços"
ON public.servicos FOR ALL
USING (
  public.is_admin(auth.uid())
  OR (
    public.has_role(auth.uid(), 'BARBEARIA')
    AND barbearia_id = (SELECT barbearia_id FROM public.profiles WHERE id = auth.uid())
  )
);