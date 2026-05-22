-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create device_reports table
CREATE TABLE public.device_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL, -- mobile, laptop, tablet, other
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  imei TEXT,
  serial_number TEXT,
  uuid_identifier TEXT,
  lost_date DATE NOT NULL,
  last_location TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'lost' NOT NULL, -- lost, found
  front_image_url TEXT,
  back_image_url TEXT,
  invoice_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for search
CREATE INDEX idx_device_reports_imei ON public.device_reports(imei) WHERE imei IS NOT NULL;
CREATE INDEX idx_device_reports_serial ON public.device_reports(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX idx_device_reports_uuid ON public.device_reports(uuid_identifier) WHERE uuid_identifier IS NOT NULL;
CREATE INDEX idx_device_reports_brand_model ON public.device_reports(brand, model);
CREATE INDEX idx_device_reports_user_id ON public.device_reports(user_id);

-- Enable RLS on device_reports
ALTER TABLE public.device_reports ENABLE ROW LEVEL SECURITY;

-- Device reports policies
CREATE POLICY "Anyone can view device reports"
  ON public.device_reports FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own device reports"
  ON public.device_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device reports"
  ON public.device_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device reports"
  ON public.device_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for device images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('device-images', 'device-images', true);

-- Storage policies for device images
CREATE POLICY "Anyone can view device images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'device-images');

CREATE POLICY "Authenticated users can upload device images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'device-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own device images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'device-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own device images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'device-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_device_reports_updated_at
  BEFORE UPDATE ON public.device_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();