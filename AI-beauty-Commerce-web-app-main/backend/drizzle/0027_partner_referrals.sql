CREATE TABLE partner_referrals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), membership_id uuid NOT NULL UNIQUE REFERENCES workspace_records(id) ON DELETE RESTRICT,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT, code text NOT NULL UNIQUE,
 commission_bps integer NOT NULL DEFAULT 0 CHECK (commission_bps BETWEEN 0 AND 5000), updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE order_partner_attributions (
 order_id uuid PRIMARY KEY REFERENCES orders(id) ON DELETE RESTRICT, referral_id uuid NOT NULL REFERENCES partner_referrals(id) ON DELETE RESTRICT,
 commission_bps integer NOT NULL CHECK (commission_bps BETWEEN 0 AND 5000), created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE wallet_accounts ADD COLUMN referral_id uuid UNIQUE REFERENCES partner_referrals(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE wallet_accounts DROP CONSTRAINT wallet_exactly_one_owner;
--> statement-breakpoint
ALTER TABLE wallet_accounts ADD CONSTRAINT wallet_exactly_one_owner CHECK ((distributor_id IS NOT NULL)::int + (creator_id IS NOT NULL)::int + (referral_id IS NOT NULL)::int = 1);
