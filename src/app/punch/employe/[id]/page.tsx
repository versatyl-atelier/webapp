import {
  WEEK_FROZEN_MESSAGE,
  WEEK_FROZEN_NOTICE,
} from "@/schemas/frozenWeeks.schemas";
import { getWeeklyKilometrage } from "@/actions/weeklyKilometrage";

import { ObjectivesAndKilometrageForm } from "@/components/ObjectivesAndKilometrageForm";
import ManualTimeForm from "@/components/ManualTimeForm";
import FillDayForm from "@/components/FillDayForm";

import { notFound } from "next/navigation";
import { getEmployee } from "@/actions/employees";
import { getProjects } from "@/actions/projects";
import { getTasks } from "@/actions/tasks";
import { CALENDAR_WEEK_PARAM } from "@/constants/calendar";
import { mondayOf, parseWeekParam, toLocalDateKey } from "@/lib/calendar";
import {
  calculateHours,
  DEFAULT_WEEKLY_TARGET,
  getEmployeeWeek,
} from "@/lib/employee-week";
import { formatTimeDisplay, isSameDay } from "@/lib/time";
import type { TimeEntryWithRelations } from "@/schemas/timeEntries.schemas";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FreezeForm } from "@/components/FreezeForm";
import EditTimeEntryForm from "@/components/EditTimeEntryForm";
import { PageContextProvider } from "./context-provider";

const dayNames = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

interface DayData {
  date: Date;
  dateStr: string;
  entries: TimeEntryWithRelations[];
  total: number;
}

export type EmployeePageParams = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function EmployeePage({
  params,
  searchParams,
}: EmployeePageParams) {
  const { id } = await params;
  const employeeId = parseInt(id, 10);
  const employee = await getEmployee(employeeId);

  if (!employee) {
    return notFound();
  }

  const todayKey = toLocalDateKey(new Date());
  const weekStartKey = parseWeekParam(
    (await searchParams)[CALENDAR_WEEK_PARAM],
    todayKey,
  );
  const isCurrentWeek = weekStartKey === mondayOf(todayKey);
  const {
    week: thisWeek,
    weekStart,
    objective,
    timeEntries,
    weekly,
    weekFrozen,
  } = await getEmployeeWeek(employee, weekStartKey);

  const today = new Date();

  const hoursDifference =
    weekly - (employee.weeklyTarget || DEFAULT_WEEKLY_TARGET);

  const daysData: DayData[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(thisWeek.startDate);
    date.setDate(date.getDate() + i);
    const dayEntries = timeEntries.filter((e) => isSameDay(e.start, date));

    const total = dayEntries.reduce((sum, e) => sum + calculateHours(e), 0);

    daysData.push({
      date,
      dateStr: date.toString(),
      entries: dayEntries,
      total,
    });
  }

  const dateOptions = daysData.map((day, i) => ({
    value: day.date.toISOString().split("T")[0],
    label: `${dayNames[i].slice(0, 3)} ${day.date
      .getDate()
      .toString()
      .padStart(
        2,
        "0",
      )}/${(day.date.getMonth() + 1).toString().padStart(2, "0")}`,
  }));
  const todayIso = today.toISOString().split("T")[0];
  const defaultDate = isCurrentWeek ? todayIso : dateOptions[0]?.value;
  const dailyHours = Object.fromEntries(
    daysData.map((day, i) => [dateOptions[i].value, day.total]),
  );

  const projectsPromise = getProjects(employeeId);
  const tasksPromise = getTasks();

  const disabledReason = weekFrozen ? WEEK_FROZEN_MESSAGE : undefined;

  const weeklyKilometrage = await getWeeklyKilometrage(employeeId, weekStart);

  return (
    <PageContextProvider
      projectsPromise={projectsPromise}
      tasksPromise={tasksPromise}
    >
      <div className="relative flex flex-1 flex-col gap-2.5 p-1.5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="ml-1 text-2xl font-bold tracking-tight">
            {employee.name}
          </h1>
          {weekFrozen && (
            <Alert variant="warning" role="status" className="w-auto flex-1">
              <Info />
              <AlertDescription>{WEEK_FROZEN_NOTICE}</AlertDescription>
            </Alert>
          )}
          <FreezeForm
            employeeId={employee.id}
            weekStart={weekStart}
            weekTotal={weekly}
            objective={objective}
            weekFrozen={weekFrozen}
          />
        </div>
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[3fr_1fr]">
          <div>
            <div className="bg-card flex h-full flex-col rounded-lg border-2">
              {/* Week Grid */}
              <div className="flex flex-col">
                {/* Day Headers */}
                <div className="bg-border grid grid-cols-7 gap-px border-b">
                  {dayNames.map((name, i) => (
                    <div
                      key={name}
                      className="bg-primary text-primary-foreground px-0.5 py-1 text-center sm:px-1"
                    >
                      <div className="text-xs font-bold">{name}</div>
                      {daysData[i] && (
                        <div className="text-xs font-bold">
                          {daysData[i].date
                            .getDate()
                            .toString()
                            .padStart(2, "0")}
                          /
                          {(daysData[i].date.getMonth() + 1)
                            .toString()
                            .padStart(2, "0")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Day Content */}
                <div className="bg-muted grid grid-cols-7 gap-px p-px">
                  {daysData.map((day) => {
                    const isToday =
                      new Date(day.dateStr).toDateString() ===
                      new Date().toDateString();
                    return (
                      <div
                        key={day.dateStr}
                        className={`min-h-48 min-w-0 p-0.5 sm:min-h-64 sm:p-1 ${
                          isToday ? "bg-warning" : "bg-card"
                        }`}
                      >
                        {day.entries.map((entry) => {
                          return (
                            <EditTimeEntryForm
                              key={entry.id}
                              entry={entry}
                              disabled={disabledReason}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Day Totals */}
                <div className="bg-border grid grid-cols-7 gap-px border-t-2">
                  {daysData.map((day) => (
                    <div
                      key={`total-${day.dateStr}`}
                      className="bg-primary text-primary-foreground px-0.5 py-1 text-center text-xs font-bold sm:px-1 sm:text-sm"
                    >
                      {formatTimeDisplay(day.total)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ObjectivesAndKilometrageForm
            employeeId={employeeId}
            weekStart={weekStart}
            currentObjective={objective}
            currentKilometrage={weeklyKilometrage?.kilometrage ?? 0}
            weekly={weekly}
            hoursDifference={hoursDifference}
            disabled={disabledReason}
          />
        </div>
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <ManualTimeForm
            employeeId={employeeId}
            dateOptions={dateOptions}
            defaultDate={defaultDate}
            disabled={disabledReason}
          />
          <FillDayForm
            employeeId={employeeId}
            dateOptions={dateOptions}
            defaultDate={defaultDate}
            dailyHours={dailyHours}
            disabled={disabledReason}
          />
        </div>
      </div>
    </PageContextProvider>
  );
}
