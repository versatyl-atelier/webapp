import { WEEK_FROZEN_MESSAGE } from "@/schemas/frozenWeeks.schemas";
import { getWeeklyKilometrage } from "@/actions/weeklyKilometrage";

import { ObjectivesAndKilometrageForm } from "@/components/ObjectivesAndKilometrageForm";
import MultiPunchForm from "@/components/MultiPunchForm";
import ManualTimeForm from "@/components/ManualTimeForm";
import FillDayForm from "@/components/FillDayForm";

import { notFound } from "next/navigation";
import { getEmployee } from "@/actions/employees";
import { getActivePunch } from "@/actions/multiPunch";
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
  const todayStr = today.toString().split("T")[0];
  const todayEntries = timeEntries.filter(
    (timeEntry) =>
      new Date(timeEntry.start).toString().split("T")[0] === todayStr,
  );
  const daily = todayEntries.reduce(
    (sum: number, entry) => sum + calculateHours(entry),
    0,
  );

  const hoursDifference =
    weekly - (employee.weeklyTarget || DEFAULT_WEEKLY_TARGET);
  const isDifferencePosive = hoursDifference >= 0;

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

  const activePunch = await getActivePunch(employeeId);

  return (
    <PageContextProvider
      projectsPromise={projectsPromise}
      tasksPromise={tasksPromise}
    >
      <main className="flex flex-1 flex-col gap-2.5 p-1.5">
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[180px_1fr_180px]">
          <aside className="bg-card w-full rounded-lg border-2 p-2.5">
            <h2 className="border-primary mb-2 border-b-2 pb-1 text-center text-sm font-bold">
              Résumé
            </h2>

            <div className="space-y-1.5">
              {/* Weekly Hours */}
              <div className="border-primary bg-muted rounded border-l-4 p-2">
                <div className="text-lg font-bold">
                  {formatTimeDisplay(weekly)}
                </div>
                <div className="text-xs uppercase">Heures Semaine</div>
              </div>

              {/* Daily Hours */}
              <div className="border-primary bg-muted rounded border-l-4 p-2">
                <div className="text-lg font-bold">
                  {formatTimeDisplay(daily)}
                </div>
                <div className="text-xs uppercase">Heures Aujourd'hui</div>
              </div>

              {/* Difference */}
              <div className="border-primary bg-muted rounded border-l-4 p-2">
                <div
                  className={`text-lg font-bold ${isDifferencePosive ? "text-punch-pos-diff" : "text-punch-neg-diff"}`}
                >
                  {isDifferencePosive ? "+" : ""}
                  {formatTimeDisplay(Math.abs(hoursDifference))}
                </div>
                <div className="text-muted-foreground text-xs uppercase">
                  Différence
                </div>
              </div>

              {/* Employee Name */}
              <div className="border-primary bg-muted rounded border-l-4 p-2">
                <div className="text-lg font-bold">{employee.name}</div>
                <div className="text-muted-foreground text-xs uppercase">
                  Employé
                </div>
              </div>
            </div>
          </aside>
          <div>
            <div className="bg-card flex h-full flex-col rounded-lg border-2">
              {/* Frozen Banner */}
              {weekFrozen && (
                <div className="bg-primary text-primary-foreground text-2xs px-2 py-2 text-center font-bold sm:px-3">
                  Semaine gelée (Lecture seule) : Demander à un gestionnaire
                  pour dégeler
                </div>
              )}

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
                        className={`min-h-48 overflow-y-auto p-0.5 sm:min-h-64 sm:p-1 ${
                          isToday ? "bg-punch-today" : "bg-card"
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
            disabled={disabledReason}
          />
        </div>
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          <MultiPunchForm
            employeeId={employeeId}
            activePunch={activePunch}
            disabled={disabledReason}
          />
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
      </main>
    </PageContextProvider>
  );
}
