-- Add expected_date_time column to visitors table
ALTER TABLE public.visitors 
ADD COLUMN expected_date_time timestamp with time zone;

-- Add column to track which resident approved/declined
ALTER TABLE public.visitors 
ADD COLUMN approved_by_resident_id uuid REFERENCES auth.users(id);

-- Drop old RLS policies that only allow residents to see their own visitors
DROP POLICY IF EXISTS "Residents can view their visitor requests" ON public.visitors;
DROP POLICY IF EXISTS "Residents can update their visitor requests" ON public.visitors;

-- Create new RLS policies that allow any resident of the same flat to see and update visitors
CREATE POLICY "Residents can view visitors for their flat"
ON public.visitors
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.flat_number = visitors.flat_number
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'resident'
    )
  )
);

CREATE POLICY "Residents can update visitors for their flat"
ON public.visitors
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.flat_number = visitors.flat_number
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'resident'
    )
  )
);

-- Allow residents to insert pre-approved visitors
CREATE POLICY "Residents can create pre-approved visitors"
ON public.visitors
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.flat_number = visitors.flat_number
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'resident'
    )
  )
);