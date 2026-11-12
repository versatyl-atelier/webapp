-- Convert manual events to divers
UPDATE "calendarEvents" SET "type" = 'divers', "subcategory" = '' WHERE "type" = 'manuel';

-- AlterEnum
BEGIN;
CREATE TYPE "CalendarEventType_new" AS ENUM ('livraison', 'installation', 'divers', 'personnel');
ALTER TABLE "calendarEvents" ALTER COLUMN "type" TYPE "CalendarEventType_new" USING ("type"::text::"CalendarEventType_new");
ALTER TYPE "CalendarEventType" RENAME TO "CalendarEventType_old";
ALTER TYPE "CalendarEventType_new" RENAME TO "CalendarEventType";
DROP TYPE "public"."CalendarEventType_old";
COMMIT;
