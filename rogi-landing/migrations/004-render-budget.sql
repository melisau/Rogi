CREATE TABLE IF NOT EXISTS rogi_private.render_days(day date PRIMARY KEY, used integer NOT NULL CHECK(used>=0));
CREATE OR REPLACE FUNCTION rogi_private.claim_render(p_limit integer)
RETURNS boolean
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE claimed integer;
BEGIN
 DELETE FROM rogi_private.render_days WHERE day<current_date-7;
 INSERT INTO rogi_private.render_days VALUES(current_date,1)
 ON CONFLICT(day) DO UPDATE SET used=rogi_private.render_days.used+1 WHERE rogi_private.render_days.used<p_limit
 RETURNING used INTO claimed;
 RETURN claimed IS NOT NULL;
END $$;
