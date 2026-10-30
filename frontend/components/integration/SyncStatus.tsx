import React from "react";
import { DataSourceStatus, SyncLogStatus } from "@/types/university";
import { Badge } from "@/components/ui/Badge";

export function SyncStatus({
  status,
}: {
  status: DataSourceStatus | SyncLogStatus;
}) {
  switch (status) {
    case "Connected":
    case "Successful":
      return (
        <Badge variant="success" dot>
          {status}
        </Badge>
      );
    case "Syncing":
      return (
        <Badge variant="brand" dot pulse>
          Syncing
        </Badge>
      );
    case "Warning":
      return (
        <Badge variant="warning" dot>
          Warning
        </Badge>
      );
    case "Disconnected":
    case "Failed":
      return (
        <Badge variant="danger" dot>
          {status}
        </Badge>
      );
  }
}

