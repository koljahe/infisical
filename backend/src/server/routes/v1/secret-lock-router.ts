import { z } from "zod";

import { ApiDocsTags } from "@app/lib/api-docs";
import { writeLimit } from "@app/server/config/rateLimiter";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { AuthMode } from "@app/services/auth/auth-type";

export const registerSecretLockRouter = async (server: FastifyZodProvider) => {
  server.route({
    method: "PATCH",
    url: "/:secretId/lock",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      hide: false,
      operationId: "toggleSecretLock",
      tags: [ApiDocsTags.Secrets],
      description: "Lock or unlock a secret. Only project admins can perform this action.",
      security: [
        {
          bearerAuth: []
        }
      ],
      params: z.object({
        secretId: z.string().uuid().describe("The ID of the secret to lock/unlock")
      }),
      body: z.object({
        isLocked: z.boolean().describe("Whether the secret should be locked (true) or unlocked (false)"),
        projectId: z.string().trim().describe("The project ID"),
        environment: z.string().trim().describe("The environment slug"),
        secretPath: z.string().trim().default("/").describe("The secret path")
      }),
      response: {
        200: z.object({
          secret: z.object({
            id: z.string(),
            isLocked: z.boolean()
          })
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const secret = await server.services.secret.toggleSecretLock({
        secretId: req.params.secretId,
        isLocked: req.body.isLocked,
        projectId: req.body.projectId,
        environment: req.body.environment,
        secretPath: req.body.secretPath,
        actorId: req.permission.id,
        actor: req.permission.type,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId
      });

      return { secret };
    }
  });
};
