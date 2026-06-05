import { Knex } from "knex";

import { TableName } from "../schemas";

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(TableName.SecretV2);
  if (!hasTable) return;

  const hasArchivedAt = await knex.schema.hasColumn(TableName.SecretV2, "archivedAt");

  if (!hasArchivedAt) {
    await knex.schema.alterTable(TableName.SecretV2, (t) => {
      t.timestamp("archivedAt", { useTz: true }).nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(TableName.SecretV2);
  if (!hasTable) return;

  const hasArchivedAt = await knex.schema.hasColumn(TableName.SecretV2, "archivedAt");

  if (hasArchivedAt) {
    await knex.schema.alterTable(TableName.SecretV2, (t) => {
      t.dropColumn("archivedAt");
    });
  }
}
