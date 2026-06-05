import { Knex } from "knex";

import { TableName } from "../schemas";

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(TableName.SecretFavorite))) {
    await knex.schema.createTable(TableName.SecretFavorite, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());

      t.uuid("userId").notNullable();
      t.foreign("userId").references("id").inTable(TableName.Users).onDelete("CASCADE");

      t.uuid("secretId").notNullable();
      t.foreign("secretId").references("id").inTable(TableName.SecretV2).onDelete("CASCADE");

      t.string("projectId").notNullable();
      t.foreign("projectId").references("id").inTable(TableName.Project).onDelete("CASCADE");

      t.timestamp("createdAt", { useTz: true }).defaultTo(knex.fn.now());

      t.unique(["userId", "secretId"], {
        indexName: "uidx_secret_favorite_user_secret"
      });

      t.index(["userId", "projectId"], "idx_secret_favorite_user_project");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TableName.SecretFavorite);
}
