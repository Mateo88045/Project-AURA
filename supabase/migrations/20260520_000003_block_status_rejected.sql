-- Add 'rejected' to block_status so the shadow-schedule review flow can
-- distinguish blocks the user explicitly turned down from blocks that are
-- merely pending review or never proposed.
--
-- Rejected blocks are kept (not deleted) so a future learning loop can use
-- them as negative signal for the scheduler.

alter type block_status add value if not exists 'rejected';
