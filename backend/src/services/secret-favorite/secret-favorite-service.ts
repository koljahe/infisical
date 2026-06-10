import { ForbiddenError } from "@casl/ability";

import { ActionProjectType } from "@app/db/schemas";
import { TPermissionServiceFactory } from "@app/ee/services/permission/permission-service-types";
import { ProjectPermissionSecretActions, ProjectPermissionSub } from "@app/ee/services/permission/project-permission";
import { NotFoundError } from "@app/lib/errors";
import { TProjectPermission } from "@app/lib/types";
import { TSecretV2BridgeDALFactory } from "@app/services/secret-v2-bridge/secret-v2-bridge-dal";

import { TSecretFavoriteDALFactory } from "./secret-favorite-dal";
import { TToggleSecretFavoriteDTO } from "./secret-favorite-types";

type TSecretFavoriteServiceFactoryDep = {
  secretFavoriteDAL: TSecretFavoriteDALFactory;
  secretDAL: Pick<TSecretV2BridgeDALFactory, "findById">;
  permissionService: Pick<TPermissionServiceFactory, "getProjectPermission">;
};

export type TSecretFavoriteServiceFactory = ReturnType<typeof secretFavoriteServiceFactory>;

export const secretFavoriteServiceFactory = ({
  secretFavoriteDAL,
  secretDAL,
  permissionService
}: TSecretFavoriteServiceFactoryDep) => {
  const toggleFavorite = async ({
    projectId,
    secretId,
    isFavorite,
    actorId,
    actor,
    actorAuthMethod,
    actorOrgId
  }: TToggleSecretFavoriteDTO) => {
    const { permission } = await permissionService.getProjectPermission({
      actor,
      actorAuthMethod,
      actorId,
      actorOrgId,
      projectId,
      actionProjectType: ActionProjectType.SecretManager
    });

    ForbiddenError.from(permission).throwUnlessCan(
      ProjectPermissionSecretActions.DescribeSecret,
      ProjectPermissionSub.Secrets
    );

    const secret = await secretDAL.findById(secretId);
    if (!secret) {
      throw new NotFoundError({ message: `Secret with ID '${secretId}' not found` });
    }

    const userId = actorId;

    if (isFavorite) {
      await secretFavoriteDAL.upsert([{ userId, secretId, projectId }], ["userId", "secretId"]);
    } else {
      await secretFavoriteDAL.delete({ userId, secretId });
    }

    return { isFavorite };
  };

  const getFavoriteSecretIds = async ({
    projectId,
    actorId,
    actor,
    actorAuthMethod,
    actorOrgId
  }: TProjectPermission) => {
    await permissionService.getProjectPermission({
      actor,
      actorAuthMethod,
      actorId,
      actorOrgId,
      projectId,
      actionProjectType: ActionProjectType.SecretManager
    });

    const favorites = await secretFavoriteDAL.find({ userId: actorId, projectId });
    return favorites.map((f) => f.secretId);
  };

  return {
    toggleFavorite,
    getFavoriteSecretIds
  };
};
