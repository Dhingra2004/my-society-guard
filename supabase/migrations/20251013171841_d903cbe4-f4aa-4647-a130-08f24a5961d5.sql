-- Add restrictive UPDATE policy for guards
-- Guards can only update visitors they created and only while status is 'pending'
CREATE POLICY "Guards can update their pending visitor requests"
ON public.visitors
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'guard'::app_role)
  AND guard_id = auth.uid()
  AND status = 'pending'::visitor_status
)
WITH CHECK (
  has_role(auth.uid(), 'guard'::app_role)
  AND guard_id = auth.uid()
  AND status = 'pending'::visitor_status
);