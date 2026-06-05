import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@app/config/request";

import { secretFavoriteKeys } from "./queries";

type TToggleSecretFavoriteDTO = {
  secretId: string;
  projectId: string;
  isFavorite: boolean;
};

export const useToggleSecretFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ secretId, projectId, isFavorite }: TToggleSecretFavoriteDTO) => {
      await apiRequest.put(`/api/v1/secrets/${secretId}/favorite`, {
        projectId,
        isFavorite
      });
      return { secretId, projectId, isFavorite };
    },
    onMutate: async ({ secretId, projectId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: secretFavoriteKeys.getFavorites(projectId) });

      const previousFavorites = queryClient.getQueryData<Set<string>>(
        secretFavoriteKeys.getFavorites(projectId)
      );

      queryClient.setQueryData<Set<string>>(secretFavoriteKeys.getFavorites(projectId), (old) => {
        const updated = new Set(old);
        if (isFavorite) {
          updated.add(secretId);
        } else {
          updated.delete(secretId);
        }
        return updated;
      });

      return { previousFavorites };
    },
    onError: (_err, { projectId }, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          secretFavoriteKeys.getFavorites(projectId),
          context.previousFavorites
        );
      }
    }
  });
};
