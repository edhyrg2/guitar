"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, MessageAdd01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

type CommentUser = {
  id: string;
  name: string;
  photoUrl: string | null;
};

type Reply = {
  id: string;
  body: string;
  createdAt: string;
  user: CommentUser;
};

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  user: CommentUser;
  replies: Reply[];
};

type WiringTemplateDiscussionProps = {
  templateId: string;
  currentUserId?: string | null;
};

function isImageSource(value: string | null | undefined) {
  return Boolean(value && /^(https?:\/\/|\/)/.test(value));
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function Avatar({ user, size = 8 }: { user: CommentUser; size?: number }) {
  const sizeClass = `size-${size}`;
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground",
        sizeClass
      )}
    >
      {isImageSource(user.photoUrl) ? (
        <Image src={user.photoUrl!} alt={user.name} fill unoptimized className="object-cover" />
      ) : (
        getInitials(user.name)
      )}
    </div>
  );
}

function CommentInput({
  placeholder,
  onSubmit,
  onCancel,
  autoFocus,
}: {
  placeholder: string;
  onSubmit: (text: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [text, setText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            void handleSubmit(e);
          }
        }}
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            Cancel
          </button>
        )}
        <span className="ml-auto text-[0.65rem] text-muted-foreground/60">
          Ctrl+Enter to post
        </span>
      </div>
    </form>
  );
}

function ReplyItem({
  reply,
  currentUserId,
  onDelete,
}: {
  reply: Reply;
  currentUserId?: string | null;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    setDeleting(true);
    onDelete(reply.id);
  }

  return (
    <div className="flex gap-2.5">
      <Avatar user={reply.user} size={6} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-foreground">{reply.user.name}</span>
          <span className="text-[0.65rem] text-muted-foreground">
            {formatRelativeTime(reply.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-foreground/90 whitespace-pre-wrap break-words">
          {reply.body}
        </p>
      </div>
      {currentUserId === reply.user.id && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 self-start rounded p-1 text-muted-foreground/50 transition hover:text-destructive disabled:opacity-40"
          aria-label="Delete reply"
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  templateId,
  onDelete,
  onReplyAdded,
}: {
  comment: Comment;
  currentUserId?: string | null;
  templateId: string;
  onDelete: (id: string) => void;
  onReplyAdded: (commentId: string, reply: Reply) => void;
}) {
  const router = useRouter();
  const [showReplyInput, setShowReplyInput] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function handleReply(text: string) {
    if (!currentUserId) {
      router.push("/login?callbackUrl=/");
      return;
    }

    const res = await fetch(`/api/wiring-templates/${templateId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text, parentId: comment.id }),
    });

    if (res.status === 401) {
      router.push("/login?callbackUrl=/");
      return;
    }

    if (!res.ok) throw new Error("Failed to post reply.");

    const data = (await res.json()) as { comment: Reply };
    onReplyAdded(comment.id, data.comment);
    setShowReplyInput(false);
  }

  return (
    <div className="flex gap-3">
      <Avatar user={comment.user} size={8} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">{comment.user.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap break-words">
          {comment.body}
        </p>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!currentUserId) {
                router.push("/login?callbackUrl=/");
                return;
              }
              setShowReplyInput((v) => !v);
            }}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <HugeiconsIcon icon={MessageAdd01Icon} strokeWidth={2} className="size-3.5" />
            Reply
          </button>
          {comment.replies.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
            </span>
          )}
        </div>

        {/* Replies */}
        {comment.replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3 border-l-2 border-border/40 pl-3">
            {comment.replies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                currentUserId={currentUserId}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        {/* Reply input */}
        {showReplyInput && (
          <div className="mt-3">
            <CommentInput
              placeholder={`Reply to ${comment.user.name}...`}
              onSubmit={handleReply}
              onCancel={() => setShowReplyInput(false)}
              autoFocus
            />
          </div>
        )}
      </div>

      {currentUserId === comment.user.id && (
        <button
          type="button"
          onClick={() => { setDeleting(true); onDelete(comment.id); }}
          disabled={deleting}
          className="shrink-0 self-start rounded p-1 text-muted-foreground/50 transition hover:text-destructive disabled:opacity-40"
          aria-label="Delete comment"
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
        </button>
      )}
    </div>
  );
}

export function WiringTemplateDiscussion({
  templateId,
  currentUserId,
}: WiringTemplateDiscussionProps) {
  const router = useRouter();
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/wiring-templates/${templateId}/comments`)
      .then((r) => r.json())
      .then((data: { comments?: Comment[] }) => setComments(data.comments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [templateId]);

  async function handleNewComment(text: string) {
    if (!currentUserId) {
      router.push("/login?callbackUrl=/");
      return;
    }

    const res = await fetch(`/api/wiring-templates/${templateId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });

    if (res.status === 401) {
      router.push("/login?callbackUrl=/");
      return;
    }

    if (!res.ok) throw new Error("Failed to post comment.");

    const data = (await res.json()) as { comment: Comment };
    setComments((prev) => [...prev, data.comment]);
  }

  async function handleDelete(id: string) {
    const res = await fetch(
      `/api/wiring-templates/${templateId}/comments/${id}`,
      { method: "DELETE" }
    );

    if (!res.ok) return;

    setComments((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c) => ({
          ...c,
          replies: c.replies.filter((r) => r.id !== id),
        }))
    );
  }

  function handleReplyAdded(commentId: string, reply: Reply) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
      )
    );
  }

  const totalCount = (comments ?? []).reduce((sum, c) => sum + 1 + c.replies.length, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">Discussion</h3>
        {totalCount > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {totalCount}
          </span>
        )}
      </div>

      {/* New comment input */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-4">
        {currentUserId ? (
          <CommentInput
            placeholder="Share your thoughts, tips, or questions about this wiring..."
            onSubmit={handleNewComment}
          />
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => router.push("/login?callbackUrl=/")}
                className="font-medium text-primary transition hover:text-primary/80"
              >
                Log in
              </button>{" "}
              to join the discussion.
            </p>
          </div>
        )}
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="size-8 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-3/4 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to start the discussion!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              templateId={templateId}
              onDelete={handleDelete}
              onReplyAdded={handleReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
