import { z } from "zod";

import { SecretsV2Schema } from "@app/db/schemas";
import { readLimit, writeLimit } from "@app/server/config/rateLimiter";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { AuthMode } from "@app/services/auth/auth-type";

export const registerSecretArchiveRouter = async (server: FastifyZodProvider) => {
  server.route({
    method: "GET",
    url: "/projects/:projectId/secrets/archived",
    config: {
      rateLimit: readLimit
    },
    schema: {
      operationId: "listArchivedSecrets",
      description: "List archived secrets for a project environment and path",
      params: z.object({
        projectId: z.string().trim().min(1)
      }),
      querystring: z.object({
        environment: z.string().trim().min(1),
        secretPath: z.string().trim().default("/")
      }),
      response: {
        200: z.object({
          secrets: SecretsV2Schema.pick({
            id: true,
            key: true,
            version: true,
            type: true,
            archivedAt: true,
            createdAt: true,
            updatedAt: true
          }).array()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const secrets = await server.services.secret.listArchivedSecrets({
        actorId: req.permission.id,
        actor: req.permission.type,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        projectId: req.params.projectId,
        environment: req.query.environment,
        secretPath: req.query.secretPath
      });

      return { secrets };
    }
  });

  server.route({
    method: "POST",
    url: "/secrets/:secretId/archive",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      operationId: "archiveSecret",
      description: "Archive a secret (soft-delete)",
      params: z.object({
        secretId: z.string().trim().min(1)
      }),
      body: z.object({
        projectId: z.string().trim().min(1)
      }),
      response: {
        200: z.object({
          secret: SecretsV2Schema.pick({
            id: true,
            key: true,
            version: true,
            archivedAt: true
          })
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const secret = await server.services.secret.archiveSecret({
        actorId: req.permission.id,
        actor: req.permission.type,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        projectId: req.body.projectId,
        secretId: req.params.secretId
      });

      return { secret };
    }
  });

  server.route({
    method: "POST",
    url: "/secrets/:secretId/restore",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      operationId: "restoreSecret",
      description: "Restore an archived secret",
      params: z.object({
        secretId: z.string().trim().min(1)
      }),
      body: z.object({
        projectId: z.string().trim().min(1)
      }),
      response: {
        200: z.object({
          secret: SecretsV2Schema.pick({
            id: true,
            key: true,
            version: true,
            archivedAt: true
          })
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const secret = await server.services.secret.restoreSecret({
        actorId: req.permission.id,
        actor: req.permission.type,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        projectId: req.body.projectId,
        secretId: req.params.secretId
      });

      return { secret };
    }
  });

  server.route({
    method: "DELETE",
    url: "/secrets/:secretId/permanent",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      operationId: "deleteArchivedSecretPermanently",
      description: "Permanently delete an archived secret",
      params: z.object({
        secretId: z.string().trim().min(1)
      }),
      body: z.object({
        projectId: z.string().trim().min(1)
      }),
      response: {
        200: z.object({
          secret: SecretsV2Schema.pick({
            id: true,
            key: true
          })
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT, AuthMode.IDENTITY_ACCESS_TOKEN]),
    handler: async (req) => {
      const secret = await server.services.secret.deleteArchivedSecret({
        actorId: req.permission.id,
        actor: req.permission.type,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        projectId: req.body.projectId,
        secretId: req.params.secretId
      });

      return { secret };
    }
  });
};
