"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { getAdminUsers } from "@/lib/api";
import { AdminUserRecord, AdminUserRole } from "@/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  DemoViewState,
  ViewStateControl,
} from "@/components/ui/ViewStateControl";
import { useToast } from "@/components/ui/ToastProvider";

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [viewState, setViewState] = useState<DemoViewState>("loading");

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AdminUserRole>(
    "Institutional Data Steward"
  );
  const [newDepartment, setNewDepartment] = useState(
    "Office of Institutional Data & Systems"
  );

  const { showToast } = useToast();

  const loadUsers = useCallback(async () => {
    setViewState("loading");
    try {
      const data = await getAdminUsers();
      setUsers(data);
      setViewState("ready");
    } catch {
      setViewState("error");
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const created: AdminUserRecord = {
      id: `ADM-2026-00${users.length + 1}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      department: newDepartment.trim(),
      status: "Invited",
      mfaEnabled: false,
      lastActive: "Invitation sent just now",
    };

    setUsers((prev) => [created, ...prev]);
    setNewName("");
    setNewEmail("");
    setInviteOpen(false);

    showToast({
      title: "Administrator invitation sent",
      description: `Sent onboarding credentials to ${created.email}.`,
      type: "success",
    });
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search.trim() ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const matchesStatus = statusFilter === "All" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = users.filter((u) => u.status === "Active").length;
  const mfaCount = users.filter((u) => u.mfaEnabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Admin User Management
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage authorized university administrators, registrar leads, and institutional data stewards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ViewStateControl
            current={viewState}
            onChange={setViewState}
            onRefresh={loadUsers}
          />
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Invite Admin User</span>
          </button>
        </div>
      </div>

      {viewState === "error" && (
        <ErrorState
          title="Unable to load administrative accounts"
          description="Please retry in a moment."
          onRetry={loadUsers}
        />
      )}

      {viewState === "loading" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <TableSkeleton rows={5} />
        </div>
      )}

      {viewState === "ready" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Authorized Admin Staff"
              value={String(users.length)}
              supportingText="Admin Portal governance scope"
              icon={Users}
              iconTone="indigo"
            />
            <StatCard
              label="Active Accounts"
              value={String(activeCount)}
              supportingText="Verified institutional directory"
              icon={UserCheck}
              iconTone="emerald"
            />
            <StatCard
              label="MFA Enforced"
              value={`${mfaCount} / ${users.length}`}
              supportingText="Two-factor security coverage"
              icon={ShieldCheck}
              iconTone="sky"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-card sm:grid-cols-12">
            <div className="relative sm:col-span-6">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, university email, or department..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter by admin role"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-indigo-300 focus:outline-none"
              >
                <option value="All">All Admin Roles</option>
                <option value="System Administrator">System Administrator</option>
                <option value="University Registrar Admin">
                  University Registrar Admin
                </option>
                <option value="Data Integration Engineer">
                  Data Integration Engineer
                </option>
                <option value="Institutional Data Steward">
                  Institutional Data Steward
                </option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by account status"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-indigo-300 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Invited">Invited</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Admin Users Table */}
          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No matching admin accounts"
              description="Try adjusting your search or role filter."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearch("");
                setRoleFilter("All");
                setStatusFilter("All");
              }}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3.5">Admin ID</th>
                      <th className="px-5 py-3.5">Administrator</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">Security (MFA)</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((admin) => (
                      <tr
                        key={admin.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-medium text-slate-600">
                          {admin.id}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {admin.name}
                          </p>
                          <p className="text-xs text-slate-500">{admin.email}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <Badge variant="brand">{admin.role}</Badge>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">
                          {admin.department}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {admin.mfaEnabled ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                              <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                              Setup Pending
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <Badge
                            variant={
                              admin.status === "Active"
                                ? "success"
                                : admin.status === "Invited"
                                ? "warning"
                                : "neutral"
                            }
                            dot
                          >
                            {admin.status}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          {admin.lastActive}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Invite Admin Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite University Administrator"
        subtitle="Grant role-based administrative access to the University Data Integration System"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Full Name
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Dr. Patricia Gomez"
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              University Email
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="p.gomez@university.edu"
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Administrative Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AdminUserRole)}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
            >
              <option value="System Administrator">System Administrator</option>
              <option value="University Registrar Admin">
                University Registrar Admin
              </option>
              <option value="Data Integration Engineer">
                Data Integration Engineer
              </option>
              <option value="Institutional Data Steward">
                Institutional Data Steward
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Office / Department
            </label>
            <input
              type="text"
              required
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

