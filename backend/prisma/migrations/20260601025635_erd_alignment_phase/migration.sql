-- ERD Alignment Phase 3: support soft-delete filtering in public property queries.
CREATE INDEX IF NOT EXISTS "Property_deletedAt_idx" ON "Property"("deletedAt");
