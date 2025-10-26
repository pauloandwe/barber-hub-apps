-- Criar tipos enum
CREATE TYPE user_role AS ENUM ('ADMIN', 'BARBEARIA', 'CLIENTE');
CREATE TYPE agendamento_status AS ENUM ('pendente', 'confirmado', 'cancelado');
CREATE TYPE agendamento_origem AS ENUM ('web', 'whatsapp');

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  role user_role NOT NULL DEFAULT 'CLIENTE',
  barbearia_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de barbearias
CREATE TABLE public.barbearias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de barbeiros
CREATE TABLE public.barbeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  bio TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de serviços
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  duracao_min INTEGER NOT NULL,
  preco_centavos INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  barbeiro_id UUID NOT NULL REFERENCES public.barbeiros(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  status agendamento_status DEFAULT 'pendente',
  origem agendamento_origem DEFAULT 'web',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de bloqueios
CREATE TABLE public.bloqueios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro_id UUID NOT NULL REFERENCES public.barbeiros(id) ON DELETE CASCADE,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar foreign key para barbearia_id em profiles
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_barbearia 
  FOREIGN KEY (barbearia_id) REFERENCES public.barbearias(id) ON DELETE SET NULL;

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbearias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas RLS para barbearias
CREATE POLICY "Todos podem ver barbearias ativas"
  ON public.barbearias FOR SELECT
  USING (ativo = TRUE);

CREATE POLICY "Admin pode gerenciar barbearias"
  ON public.barbearias FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Políticas RLS para barbeiros
CREATE POLICY "Todos podem ver barbeiros ativos"
  ON public.barbeiros FOR SELECT
  USING (ativo = TRUE);

CREATE POLICY "Barbearia pode gerenciar seus barbeiros"
  ON public.barbeiros FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'BARBEARIA')
      AND (role = 'ADMIN' OR barbearia_id = barbeiros.barbearia_id)
    )
  );

-- Políticas RLS para serviços
CREATE POLICY "Todos podem ver serviços ativos"
  ON public.servicos FOR SELECT
  USING (ativo = TRUE);

CREATE POLICY "Barbearia pode gerenciar seus serviços"
  ON public.servicos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'BARBEARIA')
      AND (role = 'ADMIN' OR barbearia_id = servicos.barbearia_id)
    )
  );

-- Políticas RLS para agendamentos
CREATE POLICY "Cliente vê seus próprios agendamentos"
  ON public.agendamentos FOR SELECT
  USING (
    cliente_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND (
        role = 'ADMIN' OR 
        (role = 'BARBEARIA' AND barbearia_id = agendamentos.barbearia_id)
      )
    )
  );

CREATE POLICY "Cliente pode criar agendamentos"
  ON public.agendamentos FOR INSERT
  WITH CHECK (cliente_id = auth.uid());

CREATE POLICY "Cliente pode atualizar seus agendamentos"
  ON public.agendamentos FOR UPDATE
  USING (
    cliente_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND (
        role = 'ADMIN' OR 
        (role = 'BARBEARIA' AND barbearia_id = agendamentos.barbearia_id)
      )
    )
  );

-- Políticas RLS para bloqueios
CREATE POLICY "Todos podem ver bloqueios"
  ON public.bloqueios FOR SELECT
  USING (TRUE);

CREATE POLICY "Barbearia pode gerenciar bloqueios"
  ON public.bloqueios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.barbeiros b ON b.barbearia_id = p.barbearia_id
      WHERE p.id = auth.uid() 
      AND p.role IN ('ADMIN', 'BARBEARIA')
      AND (p.role = 'ADMIN' OR b.id = bloqueios.barbeiro_id)
    )
  );

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'CLIENTE')
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Índices para performance
CREATE INDEX idx_agendamentos_cliente ON public.agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_barbeiro ON public.agendamentos(barbeiro_id);
CREATE INDEX idx_agendamentos_barbearia ON public.agendamentos(barbearia_id);
CREATE INDEX idx_agendamentos_data_inicio ON public.agendamentos(data_inicio);
CREATE INDEX idx_barbeiros_barbearia ON public.barbeiros(barbearia_id);
CREATE INDEX idx_servicos_barbearia ON public.servicos(barbearia_id);