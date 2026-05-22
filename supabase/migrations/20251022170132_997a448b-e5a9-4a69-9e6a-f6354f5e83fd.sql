-- Allow anyone to view profiles of users who own lost devices
-- This is needed so finders can contact device owners
CREATE POLICY "Anyone can view profiles of lost device owners"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM device_reports 
    WHERE device_reports.user_id = profiles.id 
    AND device_reports.status = 'lost'
  )
);