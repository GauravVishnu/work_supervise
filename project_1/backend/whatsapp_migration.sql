-- Add online status and last seen to users table
ALTER TABLE public.user_details_m 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;

-- Add status column to messages table for delivery/read receipts
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent';

-- Update existing messages to have 'sent' status
UPDATE messages SET status = 'sent' WHERE status IS NULL;

-- Create index for faster message queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_on_server);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- Create index for online users
CREATE INDEX IF NOT EXISTS idx_users_online ON public.user_details_m(is_online);
