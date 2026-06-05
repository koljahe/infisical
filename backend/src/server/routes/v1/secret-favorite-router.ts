import { z } from "zod";

import { writeLimit } from "@app/server/config/rateLimiter";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { AuthMode } from "@app/services/auth/auth-type";

export const registerSecretFavoriteRouter = async (server: FastifyZodProvider) => {
  server.route({
    method: "PUT",
    url: "/:secretId/favorite",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      params: z.object({
        secretId: z.string().trim()
      }),
      body: z.object({
        projectId: z.string().trim(),
        isFavorite: z.boolean()
      }),
      response: {
        200: z.object({
          isFavorite: z.boolean()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const result = await server.services.secretFavorite.toggleFavorite({
        secretId: req.params.secretId,
        projectId: req.body.projectId,
        isFavorite: req.body.isFavorite,
        actorId: req.permission.id,
        actor: req.permission.type,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId
      });

      return result;
    }
  });

  server.route({
    method: "GET",
    url: "/favorites",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      querystring: z.object({
        projectId: z.string().trim()
      }),
      response: {
        200: z.object({
          favoriteSecretIds: z.string().array()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const favoriteSecretIds = await server.services.secretFavorite.getFavoriteSecretIds({
        projectId: req.query.projectId,
        actorId: req.permission.id,
        actor: req.permission.type,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId
      });

      return { favoriteSecretIds };
    }
  });
};
