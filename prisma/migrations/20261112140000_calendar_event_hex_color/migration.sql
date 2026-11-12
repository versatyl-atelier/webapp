-- AlterTable
ALTER TABLE "calendarEvents" ALTER COLUMN "color" TYPE TEXT USING (
  CASE "color"::text
    WHEN 'blue' THEN '#3B7DD8'
    WHEN 'teal' THEN '#0F9E7B'
    WHEN 'purple' THEN '#8B5CF6'
    WHEN 'orange' THEN '#E07C3A'
    WHEN 'pink' THEN '#C2507A'
    WHEN 'indigo' THEN '#4F63D2'
    WHEN 'lime' THEN '#5F9E3A'
    WHEN 'amber' THEN '#C9850C'
  END
);

-- DropEnum
DROP TYPE "CalendarEventColor";
