CREATE TABLE public.feedback_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_event_id TEXT,
  page_label TEXT,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  before_item JSONB,
  after_item JSONB,
  reason TEXT,
  client_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.feedback_events TO anon;
GRANT SELECT, INSERT ON public.feedback_events TO authenticated;
GRANT ALL ON public.feedback_events TO service_role;
ALTER TABLE public.feedback_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert feedback" ON public.feedback_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read feedback" ON public.feedback_events FOR SELECT TO anon, authenticated USING (true);