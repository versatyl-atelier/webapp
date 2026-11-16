-- MigrateData: remove the tasks copied into projects by the initial port
DELETE FROM "projects" AS p
WHERE p."id" ~ '^[0-9]{1,10}$'
  AND NOT EXISTS (SELECT 1 FROM "timeEntryProjects" AS e WHERE e."projectId" = p."id")
  AND NOT EXISTS (SELECT 1 FROM "projectPieces" AS pp WHERE pp."projectId" = p."id");

-- AddCheckConstraint: task ids are integers, project ids never are
ALTER TABLE "projects" ADD CONSTRAINT "projects_id_not_task_id" CHECK ("id" !~ '^[0-9]{1,10}$') NOT VALID;
