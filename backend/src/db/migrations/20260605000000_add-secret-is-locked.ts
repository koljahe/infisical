import { Knex } from "knex";

import { TableName } from "../schemas";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn(TableName.SecretV2, "isLocked");
  if (!hasColumn) {
    await knex.schema.table(TableName.SecretV2, (table) => {
      table.boolean("isLocked").notNullable().defaultTo(false);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn(TableName.SecretV2, "isLocked");
  if (hasColumn) {
    await knex.schema.table(TableName.SecretV2, (table) => {
      table.dropColumn("isLocked");
    });
  }
}
