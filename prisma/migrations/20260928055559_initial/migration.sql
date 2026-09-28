-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('trello', 'task');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('employee', 'manager');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('livraison', 'installation', 'manuel');

-- CreateEnum
CREATE TYPE "CalendarEventColor" AS ENUM ('blue', 'teal', 'purple', 'orange', 'pink', 'indigo', 'lime', 'amber');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "RecurrenceEnd" AS ENUM ('never', 'date', 'count');

-- CreateTable
CREATE TABLE "statuts" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,

    CONSTRAINT "statuts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statutSourcePermissions" (
    "statutId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "statutSourcePermissions_pkey" PRIMARY KEY ("statutId","sourceId")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "weeklyTarget" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "statutId" TEXT DEFAULT 'atelier',
    "displayOrder" INTEGER NOT NULL DEFAULT 999,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT,
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "employeeId" INTEGER,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "impersonatedBy" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeEntryProjects" (
    "id" SERIAL NOT NULL,
    "timeEntryId" INTEGER NOT NULL,
    "projectId" TEXT,
    "taskId" INTEGER,
    "projectType" "ProjectType" NOT NULL,

    CONSTRAINT "timeEntryProjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeEntries" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3),
    "entryMethod" TEXT NOT NULL DEFAULT 'manual',
    "subtaskId" TEXT NOT NULL DEFAULT '1default',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeEntries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtasks" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subtasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frozenWeeks" (
    "employeeId" INTEGER NOT NULL,
    "weekStart" DATE NOT NULL,
    "weekTotal" DOUBLE PRECISION NOT NULL,
    "objective" DOUBLE PRECISION NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frozenWeeks_pkey" PRIMARY KEY ("employeeId","weekStart")
);

-- CreateTable
CREATE TABLE "weeklyKilometrage" (
    "employeeId" INTEGER NOT NULL,
    "weekStart" DATE NOT NULL,
    "kilometrage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weeklyKilometrage_pkey" PRIMARY KEY ("employeeId","weekStart")
);

-- CreateTable
CREATE TABLE "weeklyObjectives" (
    "employeeId" INTEGER NOT NULL,
    "weekStart" DATE NOT NULL,
    "objective" DOUBLE PRECISION NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weeklyObjectives_pkey" PRIMARY KEY ("employeeId","weekStart")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceId" TEXT,
    "useSignatureDate" BOOLEAN NOT NULL DEFAULT false,
    "signatureDate" DATE,
    "manualSignatureDate" DATE,
    "useApprovalDate" BOOLEAN NOT NULL DEFAULT false,
    "approvalDate" DATE,
    "manualApprovalDate" DATE,
    "useDeliveryDate" BOOLEAN NOT NULL DEFAULT false,
    "deliveryDate" DATE,
    "isDeliveryLocked" BOOLEAN NOT NULL DEFAULT false,
    "manualDeliveryDate" DATE,
    "useDaysSignatureToApproval" BOOLEAN NOT NULL DEFAULT false,
    "daysSignatureToApproval" INTEGER,
    "useDaysApprovalToDelivery" BOOLEAN NOT NULL DEFAULT false,
    "daysApprovalToDelivery" INTEGER,
    "submissionPrice" DOUBLE PRECISION NOT NULL,
    "useExtraProductionDelay" BOOLEAN NOT NULL DEFAULT false,
    "extraProductionDays" INTEGER,
    "useExtraPlanningDelay" BOOLEAN NOT NULL DEFAULT false,
    "extraPlanningDays" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#4CAF50',
    "isInCalendar" BOOLEAN NOT NULL DEFAULT false,
    "calendarOrder" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "productionDurationDays" INTEGER,
    "planningDurationDays" INTEGER,
    "calculatedPlanningStart" DATE,
    "calculatedPlanningEnd" DATE,
    "calculatedProductionStart" DATE,
    "calculatedProductionEnd" DATE,
    "calculatedDeliveryDate" DATE,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trelloSources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "boardName" TEXT,
    "labelName" TEXT,
    "icon" TEXT NOT NULL DEFAULT '📦',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trelloSources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trelloImports" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "projectsImported" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trelloImports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendarEvents" (
    "id" SERIAL NOT NULL,
    "type" "CalendarEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "date" DATE NOT NULL,
    "hour" INTEGER NOT NULL,
    "color" "CalendarEventColor" NOT NULL,
    "frequency" "RecurrenceFrequency",
    "interval" INTEGER NOT NULL DEFAULT 1,
    "weekdays" INTEGER[],
    "endType" "RecurrenceEnd" NOT NULL DEFAULT 'never',
    "endDate" DATE,
    "endCount" INTEGER,
    "trelloCardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendarEvents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chronoGroups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#666666',
    "isDone" BOOLEAN NOT NULL DEFAULT true,
    "projectedHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chronoGroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chronoGroupMembers" (
    "groupId" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "chronoGroupMembers_pkey" PRIMARY KEY ("groupId","projectType","projectId")
);

-- CreateTable
CREATE TABLE "chronoProjectSettings" (
    "projectType" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "isDone" BOOLEAN NOT NULL DEFAULT true,
    "projectedHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chronoProjectSettings_pkey" PRIMARY KEY ("projectType","projectId")
);

-- CreateTable
CREATE TABLE "chronoARRows" (
    "id" SERIAL NOT NULL,
    "factureNum" TEXT,
    "dateStr" TEXT,
    "client" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "year" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chronoARRows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chronoProjectValues" (
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "arRowId" INTEGER,
    "montant" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chronoProjectValues_pkey" PRIMARY KEY ("entityType","entityId")
);

-- CreateTable
CREATE TABLE "chronoLocalEntries" (
    "projectType" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "subtaskId" TEXT NOT NULL DEFAULT '1default',
    "hours" DOUBLE PRECISION NOT NULL,
    "subtaskName" TEXT,
    "employeeId" INTEGER,
    "employeeName" TEXT,
    "employeeStatutId" TEXT,
    "employeeStatutName" TEXT,
    "trelloSourceId" TEXT,
    "trelloSourceName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chronoLocalEntries_pkey" PRIMARY KEY ("projectType","projectId","date","subtaskId")
);

-- CreateTable
CREATE TABLE "chronoFilterRules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#4a9eff',
    "style" TEXT NOT NULL DEFAULT 'solid',
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "hasValue" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chronoFilterRules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chronoFilterSources" (
    "id" SERIAL NOT NULL,
    "ruleId" TEXT NOT NULL,
    "tableType" TEXT NOT NULL,
    "matchValue" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL DEFAULT 0,
    "matchValues" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chronoFilterSources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chronoProjectValueLines" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "arRowId" INTEGER,
    "montant" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chronoProjectValueLines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chronoGroupFinancials" (
    "groupId" TEXT NOT NULL,
    "hardwareCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "materialCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "installationPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paintshopCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chronoGroupFinancials_pkey" PRIMARY KEY ("groupId")
);

-- CreateTable
CREATE TABLE "capacityCurve" (
    "id" SERIAL NOT NULL,
    "dayPosition" TEXT NOT NULL,
    "maxCapacityPercent" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "capacityCurve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopClosures" (
    "id" SERIAL NOT NULL,
    "closureDate" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopClosures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3498db',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "statutSourcePermissions_sourceId_idx" ON "statutSourcePermissions"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "timeEntryProjects_projectId_idx" ON "timeEntryProjects"("projectId");

-- CreateIndex
CREATE INDEX "timeEntryProjects_taskId_idx" ON "timeEntryProjects"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "timeEntryProjects_timeEntryId_projectId_taskId_key" ON "timeEntryProjects"("timeEntryId", "projectId", "taskId");

-- CreateIndex
CREATE INDEX "timeEntries_employeeId_idx" ON "timeEntries"("employeeId");

-- CreateIndex
CREATE INDEX "timeEntries_start_idx" ON "timeEntries"("start");

-- CreateIndex
CREATE INDEX "projects_sourceId_idx" ON "projects"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "calendarEvents_trelloCardId_key" ON "calendarEvents"("trelloCardId");

-- CreateIndex
CREATE INDEX "calendarEvents_date_idx" ON "calendarEvents"("date");

-- AddForeignKey
ALTER TABLE "statutSourcePermissions" ADD CONSTRAINT "statutSourcePermissions_statutId_fkey" FOREIGN KEY ("statutId") REFERENCES "statuts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statutSourcePermissions" ADD CONSTRAINT "statutSourcePermissions_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "trelloSources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_statutId_fkey" FOREIGN KEY ("statutId") REFERENCES "statuts"("id") ON DELETE SET DEFAULT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeEntryProjects" ADD CONSTRAINT "timeEntryProjects_timeEntryId_fkey" FOREIGN KEY ("timeEntryId") REFERENCES "timeEntries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeEntryProjects" ADD CONSTRAINT "timeEntryProjects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeEntryProjects" ADD CONSTRAINT "timeEntryProjects_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeEntries" ADD CONSTRAINT "timeEntries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeEntries" ADD CONSTRAINT "timeEntries_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "subtasks"("id") ON DELETE SET DEFAULT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frozenWeeks" ADD CONSTRAINT "frozenWeeks_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weeklyKilometrage" ADD CONSTRAINT "weeklyKilometrage_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weeklyObjectives" ADD CONSTRAINT "weeklyObjectives_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "trelloSources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trelloImports" ADD CONSTRAINT "trelloImports_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "trelloSources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronoGroupMembers" ADD CONSTRAINT "chronoGroupMembers_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "chronoGroups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronoProjectValues" ADD CONSTRAINT "chronoProjectValues_arRowId_fkey" FOREIGN KEY ("arRowId") REFERENCES "chronoARRows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronoFilterSources" ADD CONSTRAINT "chronoFilterSources_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "chronoFilterRules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronoProjectValueLines" ADD CONSTRAINT "chronoProjectValueLines_arRowId_fkey" FOREIGN KEY ("arRowId") REFERENCES "chronoARRows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronoGroupFinancials" ADD CONSTRAINT "chronoGroupFinancials_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "chronoGroups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
