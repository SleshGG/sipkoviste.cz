-- ===========================================
-- Typ zprávy a nabídka – pro e-mailové notifikace
-- Spusť v Supabase SQL Editor (jednou).
-- ===========================================

-- message_type: 'question' | 'buy' | 'offer' | null (staré zprávy)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type text;

-- offer_amount: částka v Kč u nabídky
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS offer_amount integer;

-- offer_status: 'pending' | 'accepted' | 'rejected' | null
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS offer_status text;

-- Kontrola: message_type jen platné hodnoty
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IS NULL OR message_type IN ('question', 'buy', 'offer'));

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_offer_status_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_offer_status_check
  CHECK (offer_status IS NULL OR offer_status IN ('pending', 'accepted', 'rejected'));
