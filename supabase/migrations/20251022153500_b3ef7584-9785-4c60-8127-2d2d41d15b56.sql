-- Fix profiles table RLS policies to prevent email scraping
-- Remove the overly permissive public access policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Allow users to see their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Allow device owners to view profiles of people who messaged them about their devices
CREATE POLICY "Device owners can view message sender profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    INNER JOIN public.device_reports dr ON m.device_report_id = dr.id
    WHERE dr.user_id = auth.uid()
    AND m.sender_id = profiles.id
  )
);

-- Allow message senders to view device owner profiles they're contacting
CREATE POLICY "Message senders can view device owner profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.device_reports dr
    WHERE dr.user_id = profiles.id
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.device_report_id = dr.id
      AND m.sender_id = auth.uid()
    )
  )
);