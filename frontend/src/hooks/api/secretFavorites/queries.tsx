import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@app/config/request";

export const secretFavoriteKeys = {
  getFavorites: (projectId: string) => [{ projectId }, "secret-favorites"] as const
};

export const useGetSecretFavorites = (projectId: string, options?: { enabled?: boolean }) =>
  useQuery({
    enabled: Boolean(projectId) && (options?.enabled ?? true),
    queryKey: secretFavoriteKeys.getFavorites(projectId),
    queryFn: async () => {
      const { data } = await apiRequest.get<{ favoriteSecretIds: string[] }>(
        "/api/v1/secrets/favorites",
        { params: { projectId } }
      );
      return new Set(data.favoriteSecretIds);
    }
  });
