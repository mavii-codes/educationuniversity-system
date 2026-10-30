"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";
import { getIntegratedAlumni, syncAlumniCrm } from "@/lib/api";
import {
  AlumniCrmSourceInfo,
  IntegratedAlumniRecord,
  PortalAuthorizedRole,
} from "@/types";
import { useAuth } from "@/lib/auth";
import { getAlumniPermissions } from "@/lib/permissions";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlumniSourceInfoCard } from "./AlumniSourceInfoCard";
import { AlumniFiltersBar } from "./AlumniFiltersBar";
import { AlumniTable } from "./AlumniTable";
import { AlumniDetailModal } from "./AlumniDetailModal";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  DemoViewState,
  ViewStateControl,
} from "@/components/ui/ViewStateControl";
import { useToast } from "@/components/ui/ToastProvider";
import { formatNumber } from "@/lib/utils";

interface AlumniFeatureViewProps {
  defaultRole?: PortalAuthorizedRole;
}

export function AlumniFeatureView({
  defaultRole = "Administrator",
}: AlumniFeatureViewProps) {
  const { user } = useAuth();
  const effectiveRole: PortalAuthorizedRole = user?.role || defaultRole;
  const permissions = getAlumniPermissions(effectiveRole);

  const [sourceInfo, setSourceInfo] = useState<AlumniCrmSourceInfo | null>(null);
  const [records, setRecords] = useState<IntegratedAlumniRecord[]>([]);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const [programFilter, setProgramFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedAlumni, setSelectedAlumni] =
    useState<IntegratedAlumniRecord | null>(null);
  const [viewState, setViewState] = useState<DemoViewState>("loading");

  const { showToast } = useToast();

  const loadAlumniData = useCallback(
    async (notify = false) => {
      setViewState("loading");
      try {
        const data = await getIntegratedAlumni();
        setSourceInfo(data.sourceInfo);
        setRecords(data.records);
        setViewState("ready");
        if (notify) {
          showToast({
            title: "Alumni records refreshed",
            description:
              "Loaded latest integrated alumni dataset from Alumni CRM.",
            type: "success",
          });
        }
      } catch {
        setViewState("error");
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadAlumniData(false);
  }, [loadAlumniData]);

  const handleSyncCrm = async () => {
    if (!sourceInfo) return;
    setSourceInfo((prev) =>
      prev ? { ...prev, connectionStatus: "Syncing" } : prev
    );

    try {
      const res = await syncAlumniCrm();
      setSourceInfo((prev) =>
        prev
          ? {
              ...prev,
              connectionStatus: "Connected",
              lastSynchronization: res.lastSynchronization,
            }
          : prev
      );
      showToast({
        title: "Alumni CRM synchronized",
        description: `${formatNumber(sourceInfo.recordsSynchronized)} alumni records verified via API / ETL pipeline.`,
        type: "success",
      });
    } catch {
      setSourceInfo((prev) =>
        prev ? { ...prev, connectionStatus: "Warning" } : prev
      );
    }
  };

  const availableBatches = useMemo(() => {
    const unique = Array.from(new Set(records.map((r) => r.batch)));
    return unique.sort((a, b) => Number(b) - Number(a));
  }, [records]);

  const availablePrograms = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((r) => {
      if (!map.has(r.programCode)) {
        map.set(r.programCode, r.program);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [records]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((item) => {
      const matchesSearch =
        !q ||
        item.fullName.toLowerCase().includes(q) ||
        item.studentId.toLowerCase().includes(q) ||
        item.program.toLowerCase().includes(q) ||
        item.programCode.toLowerCase().includes(q);
      const matchesBatch =
        batchFilter === "All" || item.batch === batchFilter;
      const matchesProgram =
        programFilter === "All" || item.programCode === programFilter;
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesBatch && matchesProgram && matchesStatus;
    });
  }, [records, search, batchFilter, programFilter, statusFilter]);

  const handleResetFilters = () => {
    setSearch("");
    setBatchFilter("All");
    setProgramFilter("All");
    setStatusFilter("All");
  };

  if (!permissions.canViewAlumni) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Authorized access required"
        description="Only Administrator and Registrar accounts are permitted to view integrated alumni records."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Alumni
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            View and manage integrated alumni records from the university&apos;s Alumni CRM.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <ViewStateControl
            current={viewState}
            onChange={setViewState}
            onRefresh={() => loadAlumniData(true)}
          />
        </div>
      </div>

      {/* Error State */}
      {viewState === "error" && (
        <ErrorState
          title="Unable to load integrated alumni records"
          description="Please retry to reconnect with the Alumni CRM data integration service."
          onRetry={() => loadAlumniData(true)}
        />
      )}

      {/* Loading State */}
      {viewState === "loading" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <CardSkeleton key={idx} />
            ))}
          </div>
          <TableSkeleton rows={6} />
        </div>
      )}

      {/* Ready State */}
      {viewState === "ready" && sourceInfo && (
        <>
          {/* 2. Alumni Overview Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Alumni"
              value={formatNumber(sourceInfo.recordsSynchronized)}
              supportingText="Integrated from Alumni CRM"
              icon={Award}
              iconTone="indigo"
            />
            <StatCard
              label="Current Alumni Records"
              value={formatNumber(filteredRecords.length)}
              supportingText={`Of ${formatNumber(records.length)} directory sample records`}
              icon={UserCheck}
              iconTone="emerald"
            />
            <StatCard
              label="Graduation Batches"
              value={String(
                availableBatches.length || sourceInfo.graduationBatchesCount
              )}
              supportingText="Batches 2022 – 2026"
              icon={Calendar}
              iconTone="sky"
            />
            <StatCard
              label="Programs Represented"
              value={String(
                availablePrograms.length || sourceInfo.programsRepresentedCount
              )}
              supportingText="Across 6 university colleges"
              icon={BookOpen}
              iconTone="violet"
            />
          </div>

          {/* 7 & 8. External Data Source Information & Sync Status (Admin Permission) */}
          {permissions.canViewCrmIntegrationInfo && (
            <AlumniSourceInfoCard
              sourceInfo={sourceInfo}
              onSync={handleSyncCrm}
            />
          )}

          {/* 4 & 5. Search & Filters */}
          {permissions.canSearchAlumni && permissions.canFilterAlumni && (
            <AlumniFiltersBar
              search={search}
              batch={batchFilter}
              program={programFilter}
              status={statusFilter}
              batches={availableBatches}
              programs={availablePrograms}
              onSearchChange={setSearch}
              onBatchChange={setBatchFilter}
              onProgramChange={setProgramFilter}
              onStatusChange={setStatusFilter}
              onReset={handleResetFilters}
            />
          )}

          {/* Result Count Strip */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span>
                Showing{" "}
                <strong className="font-semibold text-slate-800">
                  {filteredRecords.length}
                </strong>{" "}
                integrated alumni{" "}
                {filteredRecords.length === 1 ? "record" : "records"}
              </span>
            </span>
            <span>Access Scope: {effectiveRole}</span>
          </div>

          {/* 3. Alumni List */}
          {filteredRecords.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No matching alumni records"
              description="Try adjusting your search query, graduation batch, or program filter."
              actionLabel="Reset Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <AlumniTable
              records={filteredRecords}
              onSelectAlumni={(record) => {
                if (permissions.canViewAlumniDetails) {
                  setSelectedAlumni(record);
                }
              }}
            />
          )}

          {/* 6. Alumni Details Modal */}
          <AlumniDetailModal
            alumni={selectedAlumni}
            permissions={permissions}
            onClose={() => setSelectedAlumni(null)}
          />
        </>
      )}
    </div>
  );
}

