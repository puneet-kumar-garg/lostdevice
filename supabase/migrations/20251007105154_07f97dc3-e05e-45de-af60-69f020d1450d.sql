-- Add is_read column to messages table
ALTER TABLE public.messages
ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries on unread messages
CREATE INDEX idx_messages_receiver_unread 
ON public.messages(receiver_id, is_read) 
WHERE is_read = false;

-- Add avatar_url column to profiles table
ALTER TABLE public.profiles
ADD COLUMN avatar_url TEXT;