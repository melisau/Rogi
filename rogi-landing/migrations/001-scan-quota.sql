CREATE SCHEMA IF NOT EXISTS rogi_private;
CREATE TABLE IF NOT EXISTS rogi_private.scan_windows(scope text NOT NULL, client text NOT NULL, window_start timestamptz NOT NULL, used integer NOT NULL CHECK(used>=0), PRIMARY KEY(scope,client,window_start));
CREATE TABLE IF NOT EXISTS rogi_private.scan_leases(id uuid PRIMARY KEY,scope text NOT NULL,expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS scan_leases_scope_expiry ON rogi_private.scan_leases(scope,expires_at);
CREATE OR REPLACE FUNCTION rogi_private.claim_scan(p_scope text,p_client text,p_id uuid)
RETURNS TABLE(allowed boolean,retry_after integer,reason text)
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE current_time_value timestamptz:=clock_timestamp(); minute_start timestamptz; client_used integer; global_used integer;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('rogi-quota:'||p_scope,0));
 current_time_value:=clock_timestamp();minute_start:=date_trunc('minute',current_time_value);
 DELETE FROM rogi_private.scan_windows WHERE scope=p_scope AND window_start<minute_start-interval '1 minute';
 DELETE FROM rogi_private.scan_leases WHERE scope=p_scope AND expires_at<=current_time_value;
 SELECT used INTO client_used FROM rogi_private.scan_windows WHERE scope=p_scope AND client=p_client AND window_start=minute_start;
 SELECT used INTO global_used FROM rogi_private.scan_windows WHERE scope=p_scope AND client='global' AND window_start=minute_start;
 IF coalesce(client_used,0)>=5 OR coalesce(global_used,0)>=60 THEN
  RETURN QUERY SELECT false,greatest(1,ceil(extract(epoch FROM minute_start+interval '1 minute'-current_time_value))::integer),'rate';RETURN;
 END IF;
 IF (SELECT count(*) FROM rogi_private.scan_leases WHERE scope=p_scope)>=3 THEN
  RETURN QUERY SELECT false,10,'capacity';RETURN;
 END IF;
 INSERT INTO rogi_private.scan_windows VALUES(p_scope,p_client,minute_start,1),(p_scope,'global',minute_start,1)
 ON CONFLICT(scope,client,window_start) DO UPDATE SET used=rogi_private.scan_windows.used+1;
 INSERT INTO rogi_private.scan_leases VALUES(p_id,p_scope,current_time_value+interval '60 seconds');
 RETURN QUERY SELECT true,0,'admitted';
END $$;
