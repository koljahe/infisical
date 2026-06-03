import { faServer } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Card, CardTitle } from "@app/components/v2";
import { useGetServerVersion } from "@app/hooks/api/admin";

export const ServerVersionCard = () => {
  const { data: serverVersion, isPending } = useGetServerVersion();

  return (
    <Card className="p-6">
      <CardTitle className="mb-4 flex items-center gap-3">
        <FontAwesomeIcon icon={faServer} />
        Server Version
      </CardTitle>

      {isPending ? (
        <div className="text-sm text-gray-400">Loading...</div>
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="font-medium text-gray-300">Version</dt>
          <dd className="text-gray-400">{serverVersion?.version ?? "—"}</dd>

          <dt className="font-medium text-gray-300">Build Timestamp</dt>
          <dd className="text-gray-400">{serverVersion?.buildTimestamp ?? "—"}</dd>

          <dt className="font-medium text-gray-300">Node Version</dt>
          <dd className="text-gray-400">{serverVersion?.nodeVersion ?? "—"}</dd>
        </dl>
      )}
    </Card>
  );
};
