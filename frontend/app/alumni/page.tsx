"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Award,
  Briefcase,
  Building2,
  GraduationCap,
  Search,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAlumniData } from "@/lib/api";
import { ALUMNI_ANALYTICS } from "@/data/mock-data";
import { AlumniRecord, DashboardAnalytics } from "@/types";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart";
import { AlumniDirectoryTable } from "@/components/alumni/AlumniDirectoryTable";
import { CardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  DemoViewState,
  ViewStateControl,
} from "@/components/ui/ViewStateControl";
import { formatNumber } from "@/lib/utils";

export default function AlumniPage() {
  const [records, setRecords] = useState<AlumniRecord[]>([]);
  const [analytics, setAnalytics] = useState<typeof ALUMNI_ANALYTICS | null>(
    null
  );
  const [graduationTrends, setGraduationTrends] = useState<
    DashboardAnalytics["graduationTrends"]
  >([]);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewState, setViewState] = useState<DemoViewState>("loading");

  const loadAlumni = useCallback(async () => {
    setViewState("loading");
    try {
      const res = await getAlumniData();
      setRecords(res.records);
      setAnalytics(res.analytics);
      setGraduationTrends(res.graduationTrends);
      setViewState("ready");
    } catch {
      setViewState("error");
    }
  }, []);

  useEffect(() => {
    loadAlumni();
  }, [loadAlumni]);

  const filteredRecords = records.filter((item) => {
    const matchesSearch =
      !search.trim() ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.currentCompany.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());
    const matchesProgram =
      programFilter === "All" || item.programCode === programFilter;
    const matchesStatus =
      statusFilter === "All" || item.employmentStatus === statusFilter;
    return matchesSearch && matchesProgram && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Alumni &amp; Career Outcomes
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Graduate employability analytics and Alumni CRM directory synchronized with SIS archives.
          </p>
        </div>
        <ViewStateControl
          current={viewState}
          onChange={setViewState}
          onRefresh={loadAlumni}
        />
      </div>

      {viewState === "error" && (
        <ErrorState
          title="We couldn't load alumni records."
          description="Please try again in a moment."
          onRetry={loadAlumni}
        />
      )}

      {viewState === "loading" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <CardSkeleton key={idx} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <TableSkeleton rows={5} />
        </div>
      )}

      {viewState === "ready" && analytics && (
        <>
          {/* KPI Summary Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AnalyticsCard
              title="Overall Employment Rate"
              value={`${analytics.employmentRate}%`}
              subtitle="Employed within 6 months of graduation"
              icon={Briefcase}
              tone="emerald"
            />
            <AnalyticsCard
              title="Tracked Alumni Network"
              value="8,400"
              subtitle="Verified active Alumni CRM profiles"
              icon={Award}
              tone="indigo"
            />
            <AnalyticsCard
              title="Degree-Aligned Careers"
              value={`${analytics.employedInFieldRate}%`}
              subtitle="Working in field related to degree"
              icon={GraduationCap}
              tone="sky"
            />
            <AnalyticsCard
              title="Industry Hiring Partners"
              value={`${analytics.partnerEmployers}+`}
              subtitle="Active corporate & clinical employers"
              icon={Building2}
              tone="indigo"
            />
          </div>

          {/* 3 Alumni Analytics Charts: Employment Trends, Graduates by Year, Alumni by Program */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <AnalyticsChart
              title="Employment Trends"
              subtitle="Graduate employment rate (%) by cohort year"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics.employmentTrends}
                  margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="alumniEmpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                  />
                  <YAxis
                    domain={[75, 95]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const r = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
                          <p className="font-semibold text-slate-900">
                            Cohort {label}
                          </p>
                          <p className="mt-1 text-emerald-700 font-medium">
                            Employed: {r.employed}%
                          </p>
                          <p className="text-slate-500">
                            Postgraduate: {r.postgrad}%
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="employed"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fill="url(#alumniEmpGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </AnalyticsChart>

            <AnalyticsChart
              title="Graduates by Year"
              subtitle="Annual conferred degrees entering Alumni CRM"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={graduationTrends}
                  margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#F8FAFC" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const r = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
                          <p className="font-semibold text-slate-900">
                            Class of {label}
                          </p>
                          <p className="mt-1 text-indigo-700 font-medium">
                            {formatNumber(r.graduates)} graduates
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="graduates"
                    fill="#4F46E5"
                    radius={[6, 6, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsChart>

            <AnalyticsChart
              title="Alumni by Program"
              subtitle="Cumulative tracked alumni across degree programs"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.alumniByProgram}
                  layout="vertical"
                  margin={{ top: 4, right: 14, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="program"
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#F8FAFC" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const r = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
                          <p className="font-semibold text-slate-900">
                            {r.program} Alumni
                          </p>
                          <p className="mt-0.5 text-indigo-700 font-medium">
                            {formatNumber(r.count)} records
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#6366F1"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsChart>
          </div>

          {/* Search & Filters for Alumni Directory */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-card">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-12">
              <div className="relative sm:col-span-3 lg:col-span-6">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search alumni by name, ID, company, or location..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="lg:col-span-3">
                <select
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  aria-label="Filter alumni by program"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none"
                >
                  <option value="All">All Programs</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSBA">BSBA</option>
                  <option value="BSN">BSN</option>
                  <option value="BSCE">BSCE</option>
                  <option value="BSED">BSED</option>
                </select>
              </div>
              <div className="lg:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter alumni by employment status"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none"
                >
                  <option value="All">All Employment Statuses</option>
                  <option value="Employed">Employed</option>
                  <option value="Self-Employed">Self-Employed</option>
                  <option value="Postgraduate Studies">Postgraduate Studies</option>
                  <option value="Seeking Opportunities">Seeking Opportunities</option>
                </select>
              </div>
            </div>
          </div>

          {/* Alumni Table */}
          {filteredRecords.length === 0 ? (
            <EmptyState
              title="No alumni records found"
              description="Try adjusting your search or employment status filters."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearch("");
                setProgramFilter("All");
                setStatusFilter("All");
              }}
            />
          ) : (
            <AlumniDirectoryTable records={filteredRecords} />
          )}
        </>
      )}
    </div>
  );
}

