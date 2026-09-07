-- ============================================================
-- E-Tamu — Fix: reset password semua user yang dibuat via RPC lama
-- (Hash dari crypt() tanpa schema-qualified mungkin tidak kompatibel)
-- Set password sementara: "ResetMe123!"
-- Admin HARUS ganti setelah login.
-- ============================================================

-- Hanya update user yang dibuat dalam 7 hari terakhir
-- dan belum pernah login (aud = authenticated tapi last_sign_in_at is null)
update auth.users u
set encrypted_password = extensions.crypt('ResetMe123!', extensions.gen_salt('bf', 10)),
    updated_at = now()
where u.last_sign_in_at is null
  and u.created_at > now() - interval '7 days';

-- Set flag must_change_password di profile supaya mereka dipaksa ganti
update public.profiles p
set must_change_password = true
where p.id in (
  select id from auth.users
  where last_sign_in_at is null
    and created_at > now() - interval '7 days'
);
