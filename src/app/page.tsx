import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default async function Home() {
  const tables = [
    { name: "Statut", count: await prisma.statut.count() },
    {
      name: "StatutSourcePermission",
      count: await prisma.statutSourcePermission.count(),
    },
    { name: "Employee", count: await prisma.employee.count() },
    { name: "ActivePunch", count: await prisma.activePunch.count() },
    { name: "TimeEntry", count: await prisma.timeEntry.count() },
    { name: "Subtask", count: await prisma.subtask.count() },
    { name: "FrozenWeek", count: await prisma.frozenWeek.count() },
    {
      name: "WeeklyKilometrage",
      count: await prisma.weeklyKilometrage.count(),
    },
    { name: "WeeklyObjective", count: await prisma.weeklyObjective.count() },
    { name: "Project", count: await prisma.project.count() },
    { name: "TrelloProject", count: await prisma.trelloProject.count() },
    { name: "TrelloSource", count: await prisma.trelloSource.count() },
    {
      name: "TrelloImportHistory",
      count: await prisma.trelloImportHistory.count(),
    },
    { name: "CalendarSource", count: await prisma.calendarSource.count() },
    { name: "ChronoGroup", count: await prisma.chronoGroup.count() },
    {
      name: "ChronoGroupMember",
      count: await prisma.chronoGroupMember.count(),
    },
    {
      name: "ChronoProjectSettings",
      count: await prisma.chronoProjectSettings.count(),
    },
    { name: "ChronoARRow", count: await prisma.chronoARRow.count() },
    {
      name: "ChronoProjectValue",
      count: await prisma.chronoProjectValue.count(),
    },
    { name: "ChronoLocalEntry", count: await prisma.chronoLocalEntry.count() },
    { name: "ChronoFilterRule", count: await prisma.chronoFilterRule.count() },
    {
      name: "ChronoFilterSource",
      count: await prisma.chronoFilterSource.count(),
    },
    {
      name: "ChronoProjectValueLine",
      count: await prisma.chronoProjectValueLine.count(),
    },
    {
      name: "ChronoGroupFinancial",
      count: await prisma.chronoGroupFinancial.count(),
    },
    { name: "ShopClosure", count: await prisma.shopClosure.count() },
    { name: "Task", count: await prisma.task.count() },
    { name: "Setting", count: await prisma.setting.count() },
    { name: "GeneralSetting", count: await prisma.generalSetting.count() },
  ];

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">
          Atelier Versatyl
        </h1>
        <p className="text-gray-600 mb-8">Database Status — All 29 Tables</p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <p className="text-green-800 font-medium">
            ✅ Database connection successful
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {tables.map((table) => (
            <div
              key={table.name}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{table.name}</span>
                <span className="text-2xl font-bold text-gray-600">
                  {table.count}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">rows</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900 text-sm">
            <strong>Schema Status:</strong> All 29 tables created and ready.
            Expected row count: 0 (fresh database).
          </p>
        </div>
      </div>
    </div>
  );
}
