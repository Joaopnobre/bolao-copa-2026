-- Add revealedIndices to ChallengeAttempt (tracks which hint tiles were revealed)
ALTER TABLE "ChallengeAttempt" ADD COLUMN "revealedIndices" TEXT NOT NULL DEFAULT '[]';
