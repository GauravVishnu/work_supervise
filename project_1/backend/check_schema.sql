-- Check if required columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_details_m' 
AND column_name IN ('is_online', 'last_seen');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'status';

-- Check if you have any messages
SELECT COUNT(*) as message_count FROM messages;

-- Check if you have any friends
SELECT COUNT(*) as friend_count FROM friends WHERE status = true;
