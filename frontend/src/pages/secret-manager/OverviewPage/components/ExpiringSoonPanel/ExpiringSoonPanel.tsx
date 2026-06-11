import { format, formatDistanceToNow } from "date-fns";
import { ClockIcon } from "lucide-react";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@app/components/v3";
import { useGetExpiringSecrets } from "@app/hooks/api/secrets";

type Props = {
  projectId: string;
};

export const ExpiringSoonPanel = ({ projectId }: Props) => {
  const { data: expiringSecrets, isLoading } = useGetExpiringSecrets({ projectId });

  if (isLoading) {
    return null;
  }

  if (!expiringSecrets || expiringSecrets.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 border-yellow-600/50 bg-mineshaft-800">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <ClockIcon className="h-4 w-4 text-yellow-500" />
        <h3 className="text-sm font-medium text-mineshaft-100">
          Expiring Soon ({expiringSecrets.length})
        </h3>
        <Badge variant="warning" className="ml-auto">
          Next 7 days
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="max-h-48 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mineshaft-600 text-left text-xs text-mineshaft-400">
                <th className="pb-1 font-medium">Secret</th>
                <th className="pb-1 font-medium">Environment</th>
                <th className="pb-1 text-right font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {expiringSecrets.map((secret) => (
                <tr key={secret.id} className="border-b border-mineshaft-700 last:border-0">
                  <td className="py-1.5 font-mono text-xs text-mineshaft-200">
                    {secret.secretKey}
                  </td>
                  <td className="py-1.5 text-xs text-mineshaft-300">{secret.environmentName}</td>
                  <td className="py-1.5 text-right">
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="text-xs text-yellow-500">
                          {formatDistanceToNow(new Date(secret.expiresAt), { addSuffix: true })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {format(new Date(secret.expiresAt), "MMM d, yyyy h:mm aa")}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
