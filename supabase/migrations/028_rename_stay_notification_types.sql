-- Rename the remaining "stay"-flavored notifications_log type values to the
-- canonical "visit" nomenclature (see migrations 025 and 027). WHERE clauses
-- make each UPDATE naturally idempotent and safe to re-run.

UPDATE public.notifications_log SET type = 'visit_requested' WHERE type = 'stay_requested';
UPDATE public.notifications_log SET type = 'visit_booked'    WHERE type = 'stay_booked';
UPDATE public.notifications_log SET type = 'post_visit'      WHERE type = 'post_stay';
