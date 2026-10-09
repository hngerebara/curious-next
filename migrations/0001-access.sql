CREATE TABLE auth_user (
  id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
  email_verified boolean NOT NULL DEFAULT false, image text,
  created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL
);
CREATE TABLE auth_session (
  id text PRIMARY KEY, token text NOT NULL UNIQUE,
  user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
  ip_address text, user_agent text
);
CREATE TABLE auth_account (
  id text PRIMARY KEY, account_id text NOT NULL, provider_id text NOT NULL,
  user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  access_token text, refresh_token text, id_token text, access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz, scope text, password text,
  created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
  CONSTRAINT auth_account_provider_unique UNIQUE(provider_id, account_id)
);
CREATE TABLE auth_verification (
  id text PRIMARY KEY, identifier text NOT NULL UNIQUE, value text NOT NULL,
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL
);
CREATE TABLE abuse_window (key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);
CREATE TABLE proof_record (id text PRIMARY KEY, learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE, label text NOT NULL);
CREATE INDEX proof_record_owner ON proof_record(learner_id);
CREATE INDEX auth_session_owner ON auth_session(user_id);
