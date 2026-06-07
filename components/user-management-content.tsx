"use client";

import * as React from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  PencilEdit02Icon,
  Notification01Icon,
  UserAccountIcon,
  UserAdd01Icon,
  UserListIcon,
} from "@hugeicons/core-free-icons";

import { type UserRow } from "@/lib/user-types";
import { DataTableCard } from "@/components/data-table-card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { UserFormDialog } from "@/components/user-form-dialog";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type UserManagementContentProps = {
  initialUsers: UserRow[];
};

export function UserManagementContent({
  initialUsers,
}: UserManagementContentProps) {
  const [users, setUsers] = React.useState<UserRow[]>(initialUsers);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<UserRow | null>(null);
  const [message, setMessage] = React.useState<
    { tone: "success" | "error"; text: string } | null
  >(null);
  const messageTimeoutRef = React.useRef<number | null>(null);

  const showMessage = React.useCallback(
    (tone: "success" | "error", text: string) => {
      if (messageTimeoutRef.current) {
        window.clearTimeout(messageTimeoutRef.current);
      }

      setMessage({ tone, text });
      messageTimeoutRef.current = window.setTimeout(() => {
        setMessage(null);
        messageTimeoutRef.current = null;
      }, 4000);
    },
    []
  );

  React.useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        window.clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const stats = [
    {
      title: "Total users",
      value: String(users.length),
      change: `${users.filter((user) => user.activity === "Active").length} active`,
      detail: "across admin and staff",
      icon: UserListIcon,
    },
    {
      title: "Masters",
      value: String(users.filter((user) => user.level === "Master").length),
      change: "highest access level",
      detail: "platform level control",
      icon: UserAccountIcon,
    },
    {
      title: "Pending verification",
      value: String(users.filter((user) => user.verification === "Pending").length),
      change: "Resend later",
      detail: "email flow not wired yet",
      icon: Notification01Icon,
    },
    {
      title: "New this month",
      value: "6",
      change: "3 with photo",
      detail: "ready for onboarding",
      icon: UserAdd01Icon,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      {message ? (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm font-medium",
            message.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          {message.text}
        </div>
      ) : null}

      <section>
        <DataTableCard
          title="User datatable"
          description="Search, paginate, and prepare the module for Prisma-backed data."
          rows={users}
          searchPlaceholder="Search user, email, level"
          summaryLabel="users"
          getSearchText={(user) =>
            [user.name, user.email, user.level, user.verification, user.activity].join(
              " "
            )
          }
          getRowKey={(user) => user.email}
          toolbar={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create user
            </Button>
          }
          renderHeader={() => (
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Photo</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          )}
          renderRow={(user) => (
            <TableRow key={user.email}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.level}</TableCell>
              <TableCell>
                {user.photo && (user.photo.startsWith("/") || /^https?:\/\//i.test(user.photo)) ? (
                  <Image
                    src={user.photo}
                    alt={user.name}
                    width={28}
                    height={28}
                    unoptimized
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
                    {user.photo || user.name.slice(0, 2)}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <StatusPill
                  label={user.verification}
                  tone={user.verification === "Verified" ? "primary" : "muted"}
                />
              </TableCell>
              <TableCell>
                <StatusPill
                  label={user.activity}
                  tone={user.activity === "Active" ? "primary" : "muted"}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditTarget(user)}
                  >
                    <HugeiconsIcon
                      icon={PencilEdit02Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget(user)}
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
          emptyMessage={
            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
              No users match the current search.
            </TableCell>
          }
        />
      </section>

      <UserFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create user"
        description="Add a new user. Email verification can remain pending until Resend is connected."
        submitLabel="Create user"
        onSubmit={(value) => {
          setUsers((current) => [value, ...current]);
          showMessage("success", `${value.name} has been created.`);
        }}
      />

      <UserFormDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        title="Edit user"
        description="Update user profile, level, and active status."
        submitLabel="Save changes"
        initialValue={editTarget}
        onSubmit={(value) => {
          if (!editTarget) {
            return;
          }

          setUsers((current) =>
            current.map((user) =>
              user.email === editTarget.email ? value : user
            )
          );
          setEditTarget(null);
          showMessage("success", `${value.name} has been updated.`);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete user"
        description={`Delete ${deleteTarget?.name ?? "this user"} from the local list? This is currently a UI-only delete until Prisma actions are wired.`}
        confirmLabel="Delete user"
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          const deletedName = deleteTarget.name;
          setUsers((current) =>
            current.filter((user) => user.email !== deleteTarget.email)
          );
          setDeleteTarget(null);
          showMessage("success", `${deletedName} has been deleted.`);
        }}
      />
    </div>
  );
}
