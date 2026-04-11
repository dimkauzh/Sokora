-- This syntax is postgres only, but the file can be removed later on before merging.
-- It is here purely so that the DB updates for devs at least while developing on this PR
ALTER TABLE news ALTER id SET DATA TYPE INTEGER USING id::integer;
ALTER TABLE moderation ALTER id SET DATA TYPE INTEGER USING id::integer;