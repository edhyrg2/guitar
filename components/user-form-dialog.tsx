"use client";

import * as React from "react";

import {
  USER_ACTIVITY_OPTIONS,
  USER_LEVEL_OPTIONS,
  type UserRow,
} from "@/lib/user-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/status-pill";

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: UserRow | null;
  onSubmit: (value: UserRow) => void;
};

const defaultUser: UserRow = {
  name: "",
  email: "",
  level: "User",
  photo: "",
  verification: "Pending",
  activity: "Active",
};

export function UserFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
}: UserFormDialogProps) {
  const formKey = `${initialValue?.email ?? "new"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <UserFormDialogContent
        key={formKey}
        title={title}
        description={description}
        submitLabel={submitLabel}
        initialValue={initialValue}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

type UserFormDialogContentProps = {
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: UserRow | null;
  onSubmit: (value: UserRow) => void;
  onCancel: () => void;
};

function UserFormDialogContent({
  title,
  description,
  submitLabel,
  initialValue,
  onSubmit,
  onCancel,
}: UserFormDialogContentProps) {
  const [form, setForm] = React.useState<UserRow>(initialValue ?? defaultUser);

  const updateField = <K extends keyof UserRow>(key: K, value: UserRow[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Name</span>
          <Input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Maya Chen"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Email</span>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="maya@northstar.app"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Password</span>
          <Input type="password" placeholder="Minimum 8 characters" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Level</span>
          <select
            value={form.level}
            onChange={(event) =>
              updateField("level", event.target.value as UserRow["level"])
            }
            className="h-7 rounded-md border border-input bg-input/20 px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            {USER_LEVEL_OPTIONS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Status</span>
          <select
            value={form.activity}
            onChange={(event) =>
              updateField("activity", event.target.value as UserRow["activity"])
            }
            className="h-7 rounded-md border border-input bg-input/20 px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            {USER_ACTIVITY_OPTIONS.map((activity) => (
              <option key={activity} value={activity}>
                {activity}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium">Photo initials</span>
          <Input
            value={form.photo}
            onChange={(event) => updateField("photo", event.target.value.toUpperCase())}
            placeholder="MC"
          />
        </label>
        <div className="sm:col-span-2 flex items-center justify-between rounded-md border p-3">
          <div className="flex flex-col gap-1">
            <span className="font-medium">Email verification</span>
            <span className="text-muted-foreground">
              Default state can stay pending until Resend is integrated.
            </span>
          </div>
          <StatusPill
            label={form.verification}
            tone={form.verification === "Verified" ? "primary" : "muted"}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            onSubmit({
              ...form,
              photo: form.photo || form.name.slice(0, 2).toUpperCase(),
            });
            onCancel();
          }}
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
