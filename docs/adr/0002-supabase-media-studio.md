# Supabase for the Media Studio

The owner-only Media Studio uses Supabase Auth for passwordless owner access, Storage for private image originals, and Postgres for photograph metadata and publication state. Public pages read only explicitly published photographs, keeping uploads, drafts, and storage credentials outside the public website.
