CREATE TABLE "asset_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" text NOT NULL,
	"opening_value" bigint NOT NULL,
	"opening_at" timestamp with time zone NOT NULL,
	"note" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "assets_owner_id_unique" UNIQUE("user_id","id"),
	CONSTRAINT "assets_type_check" CHECK ('cash' = "type" or "type" in ('bank','other')),
	CONSTRAINT "assets_value_check" CHECK ("opening_value" >= 0),
	CONSTRAINT "asset_accounts_version_check" CHECK ("version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "asset_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_account_id" uuid NOT NULL,
	"delta_amount" bigint NOT NULL,
	"reason" text NOT NULL,
	"note" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "adjustments_amount_check" CHECK ("delta_amount" <> 0),
	CONSTRAINT "adjustments_reason_check" CHECK ("reason" in ('valuation','reconciliation')),
	CONSTRAINT "adjustments_note_check" CHECK (length(trim("note")) > 0),
	CONSTRAINT "asset_adjustments_version_check" CHECK ("version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"kind" text NOT NULL,
	"icon" varchar(50),
	"color" varchar(7),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "categories_owner_id_kind_unique" UNIQUE("user_id","id","kind"),
	CONSTRAINT "categories_kind_check" CHECK ("kind" in ('income','expense')),
	CONSTRAINT "categories_sort_check" CHECK ("sort_order" >= 0),
	CONSTRAINT "categories_version_check" CHECK ("version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "monthly_category_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"month" date NOT NULL,
	"planned_amount" bigint NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "plans_month_check" CHECK (extract(day from "month") = 1),
	CONSTRAINT "plans_amount_check" CHECK ("planned_amount" >= 0),
	CONSTRAINT "monthly_category_plans_version_check" CHECK ("version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "transaction_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"asset_account_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "allocations_transaction_asset_unique" UNIQUE("transaction_id","asset_account_id"),
	CONSTRAINT "allocations_amount_check" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"amount" bigint NOT NULL,
	"title" varchar(200) NOT NULL,
	"note" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "transactions_owner_id_unique" UNIQUE("user_id","id"),
	CONSTRAINT "transactions_amount_check" CHECK ("amount" > 0),
	CONSTRAINT "transactions_version_check" CHECK ("version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"from_asset_account_id" uuid NOT NULL,
	"to_asset_account_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "transfers_different_accounts_check" CHECK ("from_asset_account_id" <> "to_asset_account_id"),
	CONSTRAINT "transfers_amount_check" CHECK ("amount" > 0),
	CONSTRAINT "transfers_version_check" CHECK ("version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"password_hash" text NOT NULL,
	"timezone" text DEFAULT 'Asia/Ho_Chi_Minh' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "asset_accounts" ADD CONSTRAINT "asset_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_adjustments" ADD CONSTRAINT "asset_adjustments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_adjustments" ADD CONSTRAINT "adjustments_owner_asset_fk" FOREIGN KEY ("user_id","asset_account_id") REFERENCES "public"."asset_accounts"("user_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_category_plans" ADD CONSTRAINT "monthly_category_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_category_plans" ADD CONSTRAINT "monthly_category_plans_user_id_category_id_kind_categories_user_id_id_kind_fk" FOREIGN KEY ("user_id","category_id","kind") REFERENCES "public"."categories"("user_id","id","kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_allocations" ADD CONSTRAINT "transaction_allocations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_allocations" ADD CONSTRAINT "transaction_allocations_user_id_transaction_id_transactions_user_id_id_fk" FOREIGN KEY ("user_id","transaction_id") REFERENCES "public"."transactions"("user_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_allocations" ADD CONSTRAINT "allocations_owner_asset_fk" FOREIGN KEY ("user_id","asset_account_id") REFERENCES "public"."asset_accounts"("user_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_category_id_kind_categories_user_id_id_kind_fk" FOREIGN KEY ("user_id","category_id","kind") REFERENCES "public"."categories"("user_id","id","kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_source_owner_fk" FOREIGN KEY ("user_id","from_asset_account_id") REFERENCES "public"."asset_accounts"("user_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_target_owner_fk" FOREIGN KEY ("user_id","to_asset_account_id") REFERENCES "public"."asset_accounts"("user_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_owner_idx" ON "asset_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "adjustments_asset_date_idx" ON "asset_adjustments" USING btree ("user_id","asset_account_id","occurred_at");--> statement-breakpoint
CREATE INDEX "categories_owner_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_active_category_month_unique" ON "monthly_category_plans" USING btree ("user_id","category_id","month") WHERE "deleted_at" is null;--> statement-breakpoint
CREATE INDEX "allocations_asset_idx" ON "transaction_allocations" USING btree ("user_id","asset_account_id");--> statement-breakpoint
CREATE INDEX "transactions_owner_date_idx" ON "transactions" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "transactions_category_date_idx" ON "transactions" USING btree ("user_id","category_id","occurred_at");--> statement-breakpoint
CREATE INDEX "transfers_source_date_idx" ON "transfers" USING btree ("user_id","from_asset_account_id","occurred_at");--> statement-breakpoint
CREATE INDEX "transfers_target_date_idx" ON "transfers" USING btree ("user_id","to_asset_account_id","occurred_at");--> statement-breakpoint
CREATE INDEX "users_created_idx" ON "users" USING btree ("created_at");