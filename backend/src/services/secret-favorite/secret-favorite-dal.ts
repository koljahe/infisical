import { TDbClient } from "@app/db";
import { TableName } from "@app/db/schemas";
import { ormify } from "@app/lib/knex";

export type TSecretFavoriteDALFactory = ReturnType<typeof secretFavoriteDALFactory>;

export const secretFavoriteDALFactory = (db: TDbClient) => {
  const orm = ormify(db, TableName.SecretFavorite);

  return { ...orm };
};
