-- ============================================================================
-- Seed file for local development
-- ============================================================================

-- Insert test user into auth.users table for local development
-- This user ID matches DEV_USER_ID from .env
DO $$
BEGIN
    -- Insert test user if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
        ) VALUES (
            '00000000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'test@example.com',
            '$2a$10$dummypasswordhashfordevelopmentonly',
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
    END IF;

    -- Insert into auth.identities if not exists
    IF NOT EXISTS (
        SELECT 1 FROM auth.identities 
        WHERE user_id = '00000000-0000-0000-0000-000000000001' 
        AND provider = 'email'
    ) THEN
        INSERT INTO auth.identities (
            provider_id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-000000000001',
            '{"sub": "00000000-0000-0000-0000-000000000001", "email": "test@example.com"}'::jsonb,
            'email',
            NOW(),
            NOW(),
            NOW()
        );
    END IF;
END $$;
