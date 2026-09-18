CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE CHECK(email=lower(email)), name text NOT NULL,
 password_hash text NOT NULL, role text NOT NULL CHECK(role IN ('OWNER','ADMIN')), active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX sessions_user_idx ON sessions(user_id); CREATE INDEX sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE,
 published boolean NOT NULL DEFAULT false, featured boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 0,
 data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX projects_public_idx ON projects(published,sort_order,id);
CREATE TABLE tools (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, published boolean NOT NULL DEFAULT true,
 sort_order integer NOT NULL DEFAULT 0, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE founders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, published boolean NOT NULL DEFAULT false,
 sort_order integer NOT NULL DEFAULT 0, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE company (id integer PRIMARY KEY DEFAULT 1 CHECK(id=1), data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE consultation_settings (id integer PRIMARY KEY DEFAULT 1 CHECK(id=1), data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE bookings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, phone text NOT NULL,
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, status text NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled','completed')),
 locale text NOT NULL DEFAULT 'en' CHECK(locale IN ('en','fa')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(ends_at>starts_at), CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (tstzrange(starts_at,ends_at,'[)') WITH &&) WHERE(status='confirmed'));
CREATE INDEX bookings_date_idx ON bookings(starts_at); CREATE INDEX bookings_created_idx ON bookings(created_at DESC);
CREATE TABLE messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, contact text NOT NULL, message text NOT NULL,
 locale text NOT NULL DEFAULT 'en' CHECK(locale IN ('en','fa')), status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','read','archived')), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE audit_logs (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
 action text NOT NULL, entity text NOT NULL, entity_id text, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX audit_created_idx ON audit_logs(created_at DESC);

