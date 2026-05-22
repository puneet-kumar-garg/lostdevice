-- Allow anyone to view profiles so they can contact device owners
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
USING (true);