ALTER TABLE "users" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_data" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_gender_check" CHECK (gender is null or gender in ('male', 'female', 'other', 'undisclosed'));