import { Knex } from "knex";

import { TableName } from "../schemas";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn(TableName.SecretV2, "encryptedDescription");
  if (!hasColumn) {
    await knex.schema.alterTable(TableName.SecretV2, (t) => {
      t.binary("encryptedDescription").nullable();
    });
  }

  const hasVersionColumn = await knex.schema.hasColumn(TableName.SecretVersionV2, "encryptedDescription");
  if (!hasVersionColumn) {
    await knex.schema.alterTable(TableName.SecretVersionV2, (t) => {
      t.binary("encryptedDescription").nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn(TableName.SecretV2, "encryptedDescription");
  if (hasColumn) {
    await knex.schema.alterTable(TableName.SecretV2, (t) => {
      t.dropColumn("encryptedDescription");
    });
  }

  const hasVersionColumn = await knex.schema.hasColumn(TableName.SecretVersionV2, "encryptedDescription");
  if (hasVersionColumn) {
    await knex.schema.alterTable(TableName.SecretVersionV2, (t) => {
      t.dropColumn("encryptedDescription");
    });
  }
}
