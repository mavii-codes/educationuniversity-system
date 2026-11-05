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
  UserX,
  Users,
} from "lucide-react";
import {
  API_CONFIG,
  createAdminLibraryStaff,
  getAdminUsers,
  updateAdminUserStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AdminUserRecord } from "@/types";
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
  const [createStaffOpen, setCreateStaffOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingStatusFor, setUpdatingStatusFor] = useState<string | null>(null);
  const [viewState, setViewState] = useState<DemoViewState>("loading");

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDepartment, setNewDepartment] = useState(
    "Library Services"
  );
  const [newPassword, setNewPassword] = useState("");

  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

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

  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await createAdminLibraryStaff({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        department: newDepartment.trim(),
      });
      setUsers((previous) => [
        created,
        ...previous.filter((user) => user.id !== created.id),
      ]);
      setNewName("");
      setNewEmail("");
      setNewDepartment("Library Services");
      setNewPassword("");
      setCreateStaffOpen(false);
      showToast({
        title: "Staff account created",
        description: `${created.name} can now sign in as a Staff Librarian.`,
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to create staff account",
        description:
          error instanceof Error ? error.message : "Please try again.",
        type: "warning",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAccountStatusChange = async (account: AdminUserRecord) => {
    const status = account.status === "Active" ? "Inactive" : "Active";
    setUpdatingStatusFor(account.id);
    try {
      const updated = await updateAdminUserStatus(account.id, status);
      setUsers((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item))
      );
      showToast({
        title: `Account ${status === "Active" ? "activated" : "deactivated"}`,
        description:
          status === "Active"
            ? `${updated.name} can sign in again.`
            : `${updated.name} can no longer sign in.`,
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to update account",
        description:
          error instanceof Error ? error.message : "Please try again.",
        type: "warning",
      });
    } finally {
      setUpdatingStatusFor(null);
    }
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
            Library Staff Accounts
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage administrator and staff librarian access.
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
            onClick={() => setCreateStaffOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Staff</span>
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
                placeholder="Search by name, email, or library department..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter by library staff role"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-indigo-300 focus:outline-none"
              >
                <option value="All">All Staff Roles</option>
                <option value="System Administrator">System Administrator</option>
                <option value="Library Staff">Staff Librarian</option>
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
                      <th className="px-5 py-3.5">Account Access</th>
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
                          <Badge variant="brand">
                            {admin.role === "Library Staff" ? "Staff Librarian" : admin.role}
                          </Badge>
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
                        <td className="whitespace-nowrap px-5 py-4">
                          <button
                            type="button"
                            onClick={() => handleAccountStatusChange(admin)}
                            disabled={
                              !API_CONFIG.useLiveApi ||
                              updatingStatusFor !== null ||
                              admin.id === currentUser?.id
                            }
                            title={
                              admin.id === currentUser?.id
                                ? "You cannot deactivate your own account."
                                : !API_CONFIG.useLiveApi
                                  ? "Account access changes require the live API."
                                  : undefined
                            }
                            aria-label={`${admin.status === "Active" ? "Deactivate" : "Activate"} ${admin.name}`}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              admin.status === "Active"
                                ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {admin.status === "Active" ? (
                              <UserX className="h-3.5 w-3.5" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}
                            {updatingStatusFor === admin.id
                              ? "Updating..."
                              : admin.status === "Active"
                                ? "Deactivate"
                                : "Activate"}
                          </button>
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

      {/* Create Staff Account Modal */}
      <Modal
        open={createStaffOpen}
        onClose={() => !creating && setCreateStaffOpen(false)}
        title="Create Staff Librarian Account"
        subtitle="Create an active staff account with sign-in credentials."
      >
        <form onSubmit={handleCreateStaffSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="staff-account-name"
              className="block text-xs font-semibold text-slate-700"
            >
              Full Name
            </label>
            <input
              id="staff-account-name"
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Dr. Patricia Gomez"
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="staff-account-email"
              className="block text-xs font-semibold text-slate-700"
            >
              University Email
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="staff-account-email"
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
              Role
            </label>
            <div className="mt-1.5 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
              Staff Librarian
            </div>
          </div>

          <div>
            <label
              htmlFor="staff-account-department"
              className="block text-xs font-semibold text-slate-700"
            >
              Library / Department
            </label>
            <input
              id="staff-account-department"
              type="text"
              required
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="staff-account-password"
              className="block text-xs font-semibold text-slate-700"
            >
              Initial Password
            </label>
            <input
              id="staff-account-password"
              type="password"
              required
              minLength={12}
              maxLength={200}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 12 characters"
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              The account is active immediately. Share this password securely with the staff member.
            </p>
          </div>

          {!API_CONFIG.useLiveApi && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Account creation is unavailable in demo mode. Configure the live API and PostgreSQL database.
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setCreateStaffOpen(false)}
              disabled={creating}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !API_CONFIG.useLiveApi}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Creating account..." : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
