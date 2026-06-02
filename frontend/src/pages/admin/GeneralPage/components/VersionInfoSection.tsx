import { faServer } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Card, CardTitle } from "@app/components/v2";
import { useGetServerVersion } from "@app/hooks/api/admin";

export const VersionInfoSection = () => {
  const { data: versionInfo, isLoading } = useGetServerVersion();

  return (
    <Card className="p-6">
      <CardTitle className="mb-4 flex items-center gap-3">
        <FontAwesomeIcon icon={faServer} />
        Server Version
      </CardTitle>
      {isLoading ? (
        <p className="text-sm text-mineshaft-300">Loading version info...</p>
      ) : (
        <div className="space-y-2 text-sm text-mineshaft-200">
          <div className="flex justify-between">
            <span className="text-mineshaft-400">Version</span>
            <span data-testid="server-version">{versionInfo?.version ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mineshaft-400">Build Timestamp</span>
            <span data-testid="build-timestamp">{versionInfo?.buildTimestamp ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mineshaft-400">Node.js Version</span>
            <span data-testid="node-version">{versionInfo?.nodeVersion ?? "—"}</span>
          </div>
        </div>
      )}
    </Card>
  );
};
