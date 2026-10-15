CREATE TABLE IF NOT EXISTS rogi_private.reports(id uuid PRIMARY KEY,project_id uuid NOT NULL REFERENCES rogi_private.projects(id) ON DELETE CASCADE,owner_id text NOT NULL,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS reports_owner_project_created ON rogi_private.reports(owner_id,project_id,created_at DESC,id DESC);
