DROP POLICY IF EXISTS "Anyone can insert validated feedback" ON public.feedback_events;

CREATE POLICY "Anyone can insert validated feedback"
ON public.feedback_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  action IN ('edit_text', 'change_confidence', 'delete', 'add')
  AND category IN (
    'people', 'topics', 'phenomena', 'organisations', 'science',
    'fictional', 'filmsTV', 'letters', 'places', 'behaviour', ''
  )
  AND (reason IS NULL OR length(reason) <= 2000)
  AND (page_label IS NULL OR length(page_label) <= 200)
);