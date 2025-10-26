-- Adicionar política para admin ver todos os perfis
CREATE POLICY "Admin pode ver todos os perfis"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Adicionar política para admin ver todos os roles
CREATE POLICY "Admin pode inserir roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));