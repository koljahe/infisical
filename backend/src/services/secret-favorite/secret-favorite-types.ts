import { TProjectPermission } from "@app/lib/types";

export type TToggleSecretFavoriteDTO = TProjectPermission & {
  secretId: string;
  isFavorite: boolean;
};

export type TGetSecretFavoritesDTO = TProjectPermission & {
  secretIds: string[];
};
