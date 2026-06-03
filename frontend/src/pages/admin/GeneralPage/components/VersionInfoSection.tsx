import { faServer } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Card, CardTitle } from "@app/components/v2";
import { useGetServerVersion } from "@app/hooks/api/admin/queries";

export const VersionInfoSection = () => {
  const { data, isLoading } = useGetServerVersion();

  return (
    <Card className="p-6">
      <CardTitle className="mb-4 flex items-center gap-3">
        <FontAwesomeIcon icon={faServer} />
        Server Version
      </CardTitle>

      {isLoading ? (
        <div className="text-sm text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <div className="text-xs text-gray-400">Version</div>
            <div className="mt-1 text-sm font-medium text-mineshaft-100">
              {data?.version || "unknown"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Build Timestamp</div>
            <div className="mt-1 text-sm font-medium text-mineshaft-100">
              {data?.buildTimestamp
                ? new Date(data.buildTimestamp).toLocaleString()
                : "unknown"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Node Version</div>
            <div className="mt-1 text-sm font-medium text-mineshaft-100">
              {data?.nodeVersion || "unknown"}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
