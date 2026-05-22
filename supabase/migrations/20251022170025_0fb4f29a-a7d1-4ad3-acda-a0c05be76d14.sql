-- Allow anyone to view lost device reports (publicly searchable)
DROP POLICY IF EXISTS "Anyone can view lost device reports" ON device_reports;

CREATE POLICY "Anyone can view lost device reports"
ON device_reports
FOR SELECT
USING (status = 'lost');

-- Keep the existing policy for users to view their own reports regardless of status
-- The "Users can view own device reports" policy already exists