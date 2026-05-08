-- Add ip column to ActionLog (nullable, non-breaking)
ALTER TABLE "ActionLog" ADD COLUMN "ip" TEXT;
