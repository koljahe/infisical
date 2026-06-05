import { Knex } from "knex";

import { TableName } from "../schemas";

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(TableName.SecretV2);
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn(TableName.SecretV2, "expiresAt");
  if (!hasColumn) {
    await knex.schema.alterTable(TableName.SecretV2, (t) => {
      t.timestamp("expiresAt", { useTz: true }).nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable(TableName.SecretV2);
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn(TableName.SecretV2, "expiresAt");
  if (hasColumn) {
    await knex.schema.alterTable(TableName.SecretV2, (t) => {
      t.dropColumn("expiresAt");
    });
  }
}
