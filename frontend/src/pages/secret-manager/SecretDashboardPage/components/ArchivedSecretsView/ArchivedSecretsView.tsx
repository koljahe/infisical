import { faArrowRotateLeft, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { createNotification } from "@app/components/notifications";
import { Button, EmptyState } from "@app/components/v2";
import { useDeleteArchivedSecret, useRestoreSecret } from "@app/hooks/api/secrets";
import { useGetArchivedSecrets } from "@app/hooks/api/secrets/queries";

type Props = {
  projectId: string;
  environment: string;
  secretPath: string;
};

export const ArchivedSecretsView = ({ projectId, environment, secretPath }: Props) => {
  const { data: archivedSecrets, isLoading } = useGetArchivedSecrets({
    projectId,
    environment,
    secretPath
  });

  const { mutateAsync: restoreSecret } = useRestoreSecret();
  const { mutateAsync: deleteArchivedSecret } = useDeleteArchivedSecret();

  const handleRestore = async (secretId: string) => {
    try {
      await restoreSecret({ secretId, projectId, environment, secretPath });
      createNotification({ type: "success", text: "Secret restored successfully" });
    } catch {
      createNotification({ type: "error", text: "Failed to restore secret" });
    }
  };

  const handlePermanentDelete = async (secretId: string) => {
    try {
      await deleteArchivedSecret({ secretId, projectId, environment, secretPath });
      createNotification({ type: "success", text: "Secret permanently deleted" });
    } catch {
      createNotification({ type: "error", text: "Failed to delete secret" });
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-mineshaft-400">Loading archived secrets...</div>;
  }

  if (!archivedSecrets || archivedSecrets.length === 0) {
    return (
      <EmptyState title="No archived secrets" className="py-12">
        <p className="text-sm text-mineshaft-400">
          When you archive a secret, it will appear here. You can restore or permanently delete it.
        </p>
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {archivedSecrets.map((secret) => (
        <div
          key={secret.id}
          className="flex items-center justify-between rounded-md border border-mineshaft-600 bg-mineshaft-800 px-4 py-3"
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-sm text-bunker-200">{secret.key}</span>
            <span className="text-xs text-mineshaft-400">
              Archived {new Date(secret.archivedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="outline_bg"
              leftIcon={<FontAwesomeIcon icon={faArrowRotateLeft} />}
              onClick={() => handleRestore(secret.id)}
            >
              Restore
            </Button>
            <Button
              size="xs"
              colorSchema="danger"
              variant="outline_bg"
              leftIcon={<FontAwesomeIcon icon={faTrash} />}
              onClick={() => handlePermanentDelete(secret.id)}
            >
              Delete permanently
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
