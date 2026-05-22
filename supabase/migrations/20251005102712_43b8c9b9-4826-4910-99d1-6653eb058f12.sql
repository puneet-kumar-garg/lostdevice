-- Create messages table for contacting device owners
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_report_id UUID NOT NULL REFERENCES public.device_reports(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender_name TEXT,
  sender_email TEXT,
  sender_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages where they are sender or receiver
CREATE POLICY "Users can view their messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Anyone can create messages (for contacting owners)
CREATE POLICY "Anyone can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Create index for faster queries
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_device ON public.messages(device_report_id);