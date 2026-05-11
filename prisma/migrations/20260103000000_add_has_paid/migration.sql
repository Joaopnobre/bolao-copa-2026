-- Add hasPaid column to User (nullable default false, non-breaking)
ALTER TABLE "User" ADD COLUMN "hasPaid" BOOLEAN NOT NULL DEFAULT false;
