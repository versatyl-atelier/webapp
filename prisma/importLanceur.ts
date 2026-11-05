import "dotenv/config";

import { DatabaseSync } from "node:sqlite";

import {
  LANCEUR_IMPORT_APPLY_FLAG,
  LANCEUR_IMPORT_DRY_RUN_LABEL,
  LANCEUR_IMPORT_DONE_LABEL,
  LANCEUR_IMPORT_RERUN_HINT,
  LANCEUR_IMPORT_USAGE,
  LANCEUR_IMPORT_WRITE_LABEL,
} from "@/constants/lanceur";
import { PLAN_SETTING_KEYS } from "@/constants/lanceurPlan";
import { LanceurOptionField } from "@/generated/prisma/enums";
import { toDbDate, type DateKey } from "@/lib/calendar";
import {
  matchEmployee,
  toImportRows,
  type ImportRow,
  type LegacyGroup,
} from "@/lib/lanceurImport";
import prisma from "@/lib/prisma";
import { phaseName } from "@/lib/projects";

type LegacyGroupRecord = Omit<
  LegacyGroup,
  "signatureDate" | "approvalDate" | "deliveryDate"
> & {
  signatureDate: string | null;
  approvalDate: string | null;
  deliveryDate: string | null;
};

type LegacyOption = { field: string; value: string; sortOrder: number };
type LegacyClosure = { closureDate: string; reason: string | null };
type LegacySetting = { key: string; value: string; type: string };
type LegacyColorLabel = { color: string; label: string };
type OptionRecord = {
  field: LanceurOptionField;
  value: string;
  sortOrder: number;
};

const SETTING_KEYS = Object.values(PLAN_SETTING_KEYS);

const GROUPS_SQL = `
  SELECT g.id, g.name, g.color, g.etape, g.installateur, g.sortOrder,
         g.livraisonComment, p.submissionPrice AS price,
         p.manualSignatureDate AS signatureDate,
         p.manualApprovalDate AS approvalDate,
         p.manualDeliveryDate AS deliveryDate
  FROM chronoGroups g
  LEFT JOIN projects p ON p.id = g.lanceurProjectId
  WHERE g.isDone = 0`;
const OPTIONS_SQL = `
  SELECT field, value, sortOrder FROM chronoFieldOptions
  WHERE field IN ('etape', 'installateur')`;
const CLOSURES_SQL = "SELECT closureDate, reason FROM shopClosures";
const SETTINGS_SQL = `SELECT key, value, type FROM generalSettings WHERE key IN (${SETTING_KEYS.map(() => "?").join(", ")})`;
const COLOR_LABELS_SQL = "SELECT color, label FROM chronoColorLabels";
const DATE_KEY_LENGTH = 10;

const legacyPath = process.argv[2];
const apply = process.argv.includes(LANCEUR_IMPORT_APPLY_FLAG);

function asDateKey(value: string | null): DateKey | null {
  return value ? value.slice(0, DATE_KEY_LENGTH) : null;
}

function readLegacy(path: string) {
  const db = new DatabaseSync(path, { readOnly: true });
  const groups = (
    db.prepare(GROUPS_SQL).all() as unknown as LegacyGroupRecord[]
  ).map((record): LegacyGroup => ({
    ...record,
    signatureDate: asDateKey(record.signatureDate),
    approvalDate: asDateKey(record.approvalDate),
    deliveryDate: asDateKey(record.deliveryDate),
  }));
  const options = db.prepare(OPTIONS_SQL).all() as unknown as LegacyOption[];
  const closures = db.prepare(CLOSURES_SQL).all() as unknown as LegacyClosure[];
  const settings = db
    .prepare(SETTINGS_SQL)
    .all(...SETTING_KEYS) as unknown as LegacySetting[];
  const colorLabels = db
    .prepare(COLOR_LABELS_SQL)
    .all() as unknown as LegacyColorLabel[];
  db.close();
  return { groups, options, closures, settings, colorLabels };
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function collectOptions(
  legacyOptions: readonly LegacyOption[],
  rows: readonly ImportRow[],
): OptionRecord[] {
  const records = new Map<string, OptionRecord>();
  const add = (field: LanceurOptionField, value: string, sortOrder: number) => {
    const key = `${field}:${value}`;
    if (value !== "" && !records.has(key)) {
      records.set(key, { field, value, sortOrder });
    }
  };
  for (const { field, value, sortOrder } of legacyOptions) {
    add(field as LanceurOptionField, value, sortOrder);
  }
  for (const row of rows) {
    add(LanceurOptionField.etape, row.etape, records.size);
    add(LanceurOptionField.installateur, row.installateur, records.size);
  }
  return [...records.values()];
}

async function createRow(tx: Tx, row: ImportRow, responsibleId: number | null) {
  await tx.project.create({
    data: {
      id: row.projectId,
      name: row.projectName,
      isManual: true,
      phases: {
        create: {
          name: phaseName(1),
          sortOrder: 0,
          lanceur: {
            create: {
              pdmDate: row.pdmDate ? toDbDate(row.pdmDate) : null,
              approvalDate: row.approvalDate
                ? toDbDate(row.approvalDate)
                : null,
              deliveryDate: row.deliveryDate
                ? toDbDate(row.deliveryDate)
                : null,
              price: row.price,
              isSigned: row.isSigned,
              priority: row.priority,
              etape: row.etape,
              installateur: row.installateur,
              deliveryComment: row.deliveryComment,
              responsibleId,
            },
          },
        },
      },
    },
  });
}

async function importLanceur() {
  if (!legacyPath) {
    console.error(LANCEUR_IMPORT_USAGE);
    process.exitCode = 1;
    return;
  }
  const legacy = readLegacy(legacyPath);
  const rows = toImportRows(legacy.groups);
  const employees = await prisma.employee.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true },
  });
  const employeeByColor = new Map<string, number>();
  const colorReport = legacy.colorLabels.map(({ color, label }) => {
    const employee = matchEmployee(label, employees);
    if (employee) {
      employeeByColor.set(color.toLowerCase(), employee.id);
    }
    return { color, label, employee: employee?.name ?? null };
  });
  const existingIds = new Set(
    (
      await prisma.project.findMany({
        where: { id: { in: rows.map((row) => row.projectId) } },
        select: { id: true },
      })
    ).map(({ id }) => id),
  );
  const toCreate = rows.filter((row) => !existingIds.has(row.projectId));

  console.log(
    apply ? LANCEUR_IMPORT_WRITE_LABEL : LANCEUR_IMPORT_DRY_RUN_LABEL,
  );
  console.table(colorReport);
  console.table(
    toCreate.map((row) => ({
      priorite: row.priority,
      projet: row.projectName,
      pdm: row.pdmDate,
      approbation: row.approvalDate,
      livraison: row.deliveryDate,
      prix: row.price,
      signe: row.isSigned,
      etape: row.etape,
      installateur: row.installateur,
      responsableId: employeeByColor.get(row.legacyColor) ?? null,
    })),
  );
  console.log({
    projetsACreer: toCreate.length,
    dejaImportes: existingIds.size,
    options: legacy.options.length,
    fermetures: legacy.closures.length,
    reglages: legacy.settings.map(({ key }) => key),
  });
  if (!apply) {
    console.log(LANCEUR_IMPORT_RERUN_HINT);
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.lanceurOption.createMany({
      data: collectOptions(legacy.options, toCreate),
      skipDuplicates: true,
    });

    const knownClosures = new Set(
      (await tx.shopClosure.findMany({ select: { closureDate: true } })).map(
        ({ closureDate }) =>
          closureDate.toISOString().slice(0, DATE_KEY_LENGTH),
      ),
    );
    await tx.shopClosure.createMany({
      data: legacy.closures
        .filter(
          ({ closureDate }) =>
            !knownClosures.has(closureDate.slice(0, DATE_KEY_LENGTH)),
        )
        .map(({ closureDate, reason }) => ({
          closureDate: toDbDate(closureDate.slice(0, DATE_KEY_LENGTH)),
          reason,
        })),
    });

    await tx.setting.createMany({
      data: legacy.settings,
      skipDuplicates: true,
    });

    for (const [color, employeeId] of employeeByColor) {
      await tx.employee.update({ where: { id: employeeId }, data: { color } });
    }

    for (const row of toCreate) {
      await createRow(tx, row, employeeByColor.get(row.legacyColor) ?? null);
    }
  });
  console.log(LANCEUR_IMPORT_DONE_LABEL);
}

importLanceur()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
