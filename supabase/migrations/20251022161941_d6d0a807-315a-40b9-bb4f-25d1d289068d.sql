-- Fix RLS policy for device_reports to prevent public access to sensitive data
DROP POLICY IF EXISTS "Anyone can view device reports" ON device_reports;

-- Users can view their own device reports
CREATE POLICY "Users can view own device reports" ON device_reports
FOR SELECT USING (auth.uid() = user_id);

-- Users who sent a message can view the device report
CREATE POLICY "Message senders can view device reports" ON device_reports
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM messages m
    WHERE m.device_report_id = device_reports.id
    AND m.sender_id = auth.uid()
  )
);

-- Fix database functions to set search_path (prevents security warnings)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;