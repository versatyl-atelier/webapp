import Link from "next/link";
import { getFrozenWeeks } from "@/actions/frozenWeeks";
import { WEEK_FROZEN_MESSAGE } from "@/schemas/frozenWeeks.schemas";
import { getWeeklyKilometrage } from "@/actions/weeklyKilometrage";

import { FreezeForm } from "@/components/FreezeForm";
import { ObjectivesAndKilometrageForm } from "@/components/ObjectivesAndKilometrageForm";
import MultiPunchForm from "@/components/MultiPunchForm";
import ManualTimeForm from "@/components/ManualTimeForm";
import FillDayForm from "@/components/FillDayForm";
import { Button } from "@/components/ui/button";

import { notFound } from "next/navigation";
import { getEmployee } from "@/actions/employees";
import { getTimeEntries } from "@/actions/timeEntries";
import { getActivePunch } from "@/actions/multiPunch";
import { getProjects } from "@/actions/projects";
import { getTasks } from "@/actions/tasks";
import {
  formatTimeDisplay,
  getThisWeek,
  isSameDay,
  isSameUTCDate,
} from "@/lib/time";
import type { TimeEntryWithRelations } from "@/schemas/timeEntries.schemas";
import EditTimeEntryForm from "@/components/EditTimeEntryForm";
import { PageContextProvider } from "./context-provider";

const defaultWeeklyTarget = 40; // TODO Find better place for this magic value

const dayNames = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const weekTitles = [
  "Semaine courante",
  "Semaine dernière",
  "Il y a 2 semaines",
  "Il y a 3 semaines",
];

interface DayData {
  date: Date;
  dateStr: string;
  entries: TimeEntryWithRelations[];
  total: number;
}

function calculateHours(entry: TimeEntryWithRelations): number {
  if (!entry.start || !entry.end) return 0;
  return (entry.end.getTime() - entry.start.getTime()) / 3600000;
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

  const query = await searchParams;
  const { weekOffset: offset } = query;
  const weekOffset = parseInt(
    Array.isArray(offset) ? offset[0] : offset || "0",
    10,
  );
  const weekTitle =
    weekTitles[Math.abs(weekOffset)] ||
    `Il y a ${Math.abs(weekOffset)} semaines`;

  const canGoBack = weekOffset > -3;
  const canGoForward = weekOffset < 0;

  const thisWeek = getThisWeek(weekOffset);
  const weeklyObjectives = employee.weeklyObjectives;
  const objective =
    weeklyObjectives.find(({ weekStart }: { weekStart: Date }) => {
      return isSameUTCDate(weekStart, thisWeek.startDate);
    })?.objective ?? defaultWeeklyTarget;
  const timeEntries = (await getTimeEntries(employee.id, thisWeek)) || [];

  const weekly = timeEntries.reduce(
    (sum, entry) => sum + calculateHours(entry),
    0,
  );

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
    weekly - (employee.weeklyTarget || defaultWeeklyTarget);
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
  const defaultDate = weekOffset === 0 ? todayIso : dateOptions[0]?.value;
  const dailyHours = Object.fromEntries(
    daysData.map((day, i) => [dateOptions[i].value, day.total]),
  );

  const projectsPromise = getProjects(employeeId);
  const tasksPromise = getTasks();

  const frozenWeeks = await getFrozenWeeks(employeeId);

  const weekStart = new Date(thisWeek.startDate);
  const weekFrozen = !!frozenWeeks?.find((entry) =>
    isSameUTCDate(entry.weekStart, weekStart),
  );
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
              {/* Week Navigation */}
              <div className="bg-muted flex items-center justify-between border-b-2 px-2 py-2 sm:px-3">
                <Button
                  disabled={!canGoBack}
                  className="text-2xs rounded-sm font-bold sm:px-2"
                >
                  <Link href={`?weekOffset=${weekOffset - 1}`}>
                    ← Précédente
                  </Link>
                </Button>

                <div className="text-xs font-bold sm:text-sm">{weekTitle}</div>

                <div className="flex gap-0.5 sm:gap-2">
                  <FreezeForm
                    employeeId={employeeId}
                    weekStart={weekStart}
                    weekTotal={weekly}
                    objective={objective}
                    weekFrozen={weekFrozen}
                  />
                  <Button
                    disabled={!canGoForward}
                    className="text-2xs rounded-sm font-bold sm:px-2"
                  >
                    <Link href={`?weekOffset=${weekOffset + 1}`}>
                      Suivante →
                    </Link>
                  </Button>
                </div>
              </div>

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
