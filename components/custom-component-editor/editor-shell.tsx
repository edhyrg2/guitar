"use client";

import * as React from "react";
import type Konva from "konva";
import { useSession } from "next-auth/react";

import { CanvasEditor } from "@/components/custom-component-editor/canvas-editor";
import { LayersPanel } from "@/components/custom-component-editor/layers-panel";
import {
  PublishDialog,
  type PublishSubmitValue,
} from "@/components/custom-component-editor/publish-dialog";
import { PropertiesPanel } from "@/components/custom-component-editor/properties-panel";
import { EditorTopbar } from "@/components/custom-component-editor/topbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toolbar } from "@/components/custom-component-editor/toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/lib/custom-component-editor-store";
import type { CustomComponentDraftRow } from "@/lib/custom-component-draft-types";
import type {
  CanvasObject,
  EditorDocument,
} from "@/lib/custom-component-editor-types";
import type { CustomComponentEditorTarget } from "@/lib/custom-component-publish-target-types";
import {
  clampZoom,
  cloneCanvasObject,
  createImageObject,
  createEditorId,
  getObjectBounds,
  normalizeEditorDocument,
  serializeEditorDocument,
} from "@/lib/custom-component-editor-utils";

function downloadDataUrl(filename: string, url: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

function downloadJsonFile(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function slugifyFilename(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "document";
}

function getFilenameBase(filename: string) {
  return filename.replace(/\.[^/.]+$/, "").trim() || "Imported Draft";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error.";
}

const AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000;
const PNG_EXPORT_PADDING = 32;

function getExportBounds(layer: Konva.Layer) {
  const objectNodes = layer
    .find(".editor-object")
    .filter((node) => node.visible() && node.opacity() > 0);

  if (objectNodes.length === 0) {
    return null;
  }

  const aggregate = objectNodes.reduce((current, node) => {
    const nextBounds = node.getClientRect({
      relativeTo: layer,
      skipShadow: false,
      skipStroke: false,
    });

    if (!current) {
      return nextBounds;
    }

    const minX = Math.min(current.x, nextBounds.x);
    const minY = Math.min(current.y, nextBounds.y);
    const maxX = Math.max(current.x + current.width, nextBounds.x + nextBounds.width);
    const maxY = Math.max(current.y + current.height, nextBounds.y + nextBounds.height);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, null as { x: number; y: number; width: number; height: number } | null);

  if (!aggregate) {
    return null;
  }

  const minX = Math.floor(aggregate.x - PNG_EXPORT_PADDING);
  const minY = Math.floor(aggregate.y - PNG_EXPORT_PADDING);
  const maxX = Math.ceil(aggregate.x + aggregate.width + PNG_EXPORT_PADDING);
  const maxY = Math.ceil(aggregate.y + aggregate.height + PNG_EXPORT_PADDING);

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

async function dataUrlToFile(dataUrl: string, filename: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}

type EditorShellProps = {
  initialTarget?: CustomComponentEditorTarget | null;
};

export function EditorShell({ initialTarget = null }: EditorShellProps) {
  const stageRef = React.useRef<Konva.Stage | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement | null>(null);
  const importJsonInputRef = React.useRef<HTMLInputElement | null>(null);
  const clipboardRef = React.useRef<CanvasObject[]>([]);
  const { data: session, status: sessionStatus } = useSession();

  const objects = useEditorStore((state) => state.objects);
  const background = useEditorStore((state) => state.background);
  const viewport = useEditorStore((state) => state.viewport);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectedConnectionPointIds = useEditorStore(
    (state) => state.selectedConnectionPointIds
  );
  const connectionPoints = useEditorStore((state) => state.connectionPoints);
  const pastCount = useEditorStore((state) => state.past.length);
  const futureCount = useEditorStore((state) => state.future.length);
  const setViewport = useEditorStore((state) => state.setViewport);
  const deleteSelectedObject = useEditorStore((state) => state.deleteSelectedObject);
  const deleteSelectedConnectionPoint = useEditorStore(
    (state) => state.deleteSelectedConnectionPoint
  );
  const alignSelectedObjects = useEditorStore((state) => state.alignSelectedObjects);
  const addObject = useEditorStore((state) => state.addObject);
  const addObjects = useEditorStore((state) => state.addObjects);
  const duplicateSelectedObject = useEditorStore(
    (state) => state.duplicateSelectedObject
  );
  const groupSelectedObjects = useEditorStore((state) => state.groupSelectedObjects);
  const moveSelectedObjects = useEditorStore((state) => state.moveSelectedObjects);
  const setSelectedLocked = useEditorStore((state) => state.setSelectedLocked);
  const setSelectedVisibility = useEditorStore((state) => state.setSelectedVisibility);
  const ungroupSelectedObjects = useEditorStore((state) => state.ungroupSelectedObjects);
  const importDocument = useEditorStore((state) => state.importDocument);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const [drafts, setDrafts] = React.useState<CustomComponentDraftRow[]>([]);
  const [activeDraftId, setActiveDraftId] = React.useState<string | null>(null);
  const [activeDraftName, setActiveDraftName] = React.useState<string | null>(null);
  const [activeDraftDescription, setActiveDraftDescription] = React.useState<string>("");
  const [draftStatus, setDraftStatus] = React.useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [saveDialogMode, setSaveDialogMode] = React.useState<"create" | "save-as">("create");
  const [draftBrowserOpen, setDraftBrowserOpen] = React.useState(false);
  const [draftName, setDraftName] = React.useState("");
  const [draftDescription, setDraftDescription] = React.useState("");
  const [isSavingDraft, setIsSavingDraft] = React.useState(false);
  const [isLoadingDrafts, setIsLoadingDrafts] = React.useState(false);
  const [draftActionId, setDraftActionId] = React.useState<string | null>(null);
  const [autosaveEnabled, setAutosaveEnabled] = React.useState(false);
  const [pendingAutosaveEnable, setPendingAutosaveEnable] = React.useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const lastSavedSnapshotRef = React.useRef<string | null>(null);
  const importedInitialTargetRef = React.useRef(false);

  const selectedObjects = React.useMemo(
    () => objects.filter((object) => selectedIds.includes(object.id)),
    [objects, selectedIds]
  );
  const selectedItemCount = selectedIds.length + selectedConnectionPointIds.length;
  const canPersistDraft = sessionStatus === "authenticated";
  const documentSnapshot = React.useMemo(
    () => JSON.stringify(serializeEditorDocument(objects, background, connectionPoints)),
    [background, connectionPoints, objects]
  );

  const markSnapshotAsSaved = React.useCallback((snapshot: string) => {
    lastSavedSnapshotRef.current = snapshot;
  }, []);

  const createPngExport = React.useCallback(() => {
    const stage = stageRef.current;

    if (!stage) {
      return null;
    }

    const layer = stage.getLayers()[0];

    if (!layer) {
      return null;
    }

    const hiddenNodes = stage.find(".editor-export-hidden");
    const previousVisibility = hiddenNodes.map((node) => node.visible());
    const previousStagePosition = { x: stage.x(), y: stage.y() };
    const previousStageScale = { x: stage.scaleX(), y: stage.scaleY() };

    hiddenNodes.forEach((node) => node.visible(false));
    stage.position({ x: 0, y: 0 });
    stage.scale({ x: 1, y: 1 });
    stage.batchDraw();

    try {
      const exportBounds = getExportBounds(layer);

      if (!exportBounds) {
        return null;
      }

      return {
        url: layer.toDataURL({
          x: exportBounds.x,
          y: exportBounds.y,
          width: exportBounds.width,
          height: exportBounds.height,
          pixelRatio: 2,
          mimeType: "image/png",
        }),
        bounds: exportBounds,
      };
    } finally {
      stage.position(previousStagePosition);
      stage.scale(previousStageScale);
      hiddenNodes.forEach((node, index) => node.visible(previousVisibility[index] ?? true));
      stage.batchDraw();
    }
  }, []);

  const persistDraftListEntry = React.useCallback(
    (nextDraft: CustomComponentDraftRow) => {
      setDrafts((current) => {
        const remaining = current.filter((item) => item.id !== nextDraft.id);
        return [nextDraft, ...remaining].sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
        );
      });
    },
    []
  );

  const handleDocumentLoaded = React.useCallback(
    (
      document: EditorDocument,
      metadata?: { id?: string | null; name?: string | null; description?: string | null }
    ) => {
      importDocument(document);
      setActiveDraftId(metadata?.id ?? null);
      setActiveDraftName(metadata?.name ?? null);
      setActiveDraftDescription(metadata?.description ?? "");
      markSnapshotAsSaved(JSON.stringify(document));
      setDraftStatus(
        metadata?.name ? `Loaded draft "${metadata.name}".` : "Loaded document."
      );
    },
    [importDocument, markSnapshotAsSaved]
  );

  const loadDrafts = React.useCallback(async () => {
    if (!canPersistDraft) {
      return;
    }

    setIsLoadingDrafts(true);

    try {
      const response = await fetch("/api/custom-component-drafts");
      const payload = (await response.json()) as
        | CustomComponentDraftRow[]
        | { error?: string };

      if (!response.ok || !Array.isArray(payload)) {
        throw new Error(
          !Array.isArray(payload) && payload.error
            ? payload.error
            : "Failed to load drafts."
        );
      }

      setDrafts(payload);
    } catch (error) {
      setDraftStatus(getErrorMessage(error));
    } finally {
      setIsLoadingDrafts(false);
    }
  }, [canPersistDraft]);

  const saveDraft = React.useCallback(
    async (
      mode: "create" | "update" | "save-as",
      override?: {
        name: string;
        description: string;
        successMessage?: string;
      }
    ) => {
      if (!canPersistDraft) {
        setDraftStatus("Sign in to save drafts.");
        return;
      }

      const name = (override?.name ?? draftName).trim();
      const description = (override?.description ?? draftDescription).trim();

      if (!name) {
        setDraftStatus("Draft name is required.");
        return;
      }

      const effectiveMode =
        mode === "save-as" ? "create" : activeDraftId ? "update" : mode;
      const effectiveDraftId = mode === "save-as" ? null : activeDraftId;

      setIsSavingDraft(true);

      try {
        const document = serializeEditorDocument(objects, background, connectionPoints);
        const thumbnailExport = createPngExport();
        const response = await fetch(
          effectiveMode === "update" && effectiveDraftId
            ? `/api/custom-component-drafts/${effectiveDraftId}`
            : "/api/custom-component-drafts",
          {
            method: effectiveMode === "update" && effectiveDraftId ? "PUT" : "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              name,
              description: description || null,
              thumbnailDataUrl: thumbnailExport?.url ?? null,
              document,
            }),
          }
        );
        const payload = (await response.json()) as
          | CustomComponentDraftRow
          | { error?: string };

        if (!response.ok || Array.isArray(payload) || !("id" in payload)) {
          throw new Error(
            !Array.isArray(payload) && "error" in payload && payload.error
              ? payload.error
              : "Failed to save draft."
          );
        }

        setActiveDraftId(payload.id);
        setActiveDraftName(payload.name);
        setActiveDraftDescription(payload.description ?? "");
        markSnapshotAsSaved(documentSnapshot);
        persistDraftListEntry(payload);
        setDraftStatus(
          override?.successMessage ?? `Draft "${payload.name}" saved.`
        );
        if (pendingAutosaveEnable) {
          setAutosaveEnabled(true);
          setPendingAutosaveEnable(false);
        }
        setSaveDialogOpen(false);
        setSaveDialogMode("create");
      } catch (error) {
        setDraftStatus(getErrorMessage(error));
      } finally {
        setIsSavingDraft(false);
      }
    },
    [
      activeDraftId,
      background,
      canPersistDraft,
      draftDescription,
      draftName,
      documentSnapshot,
      markSnapshotAsSaved,
      connectionPoints,
      createPngExport,
      objects,
      pendingAutosaveEnable,
      persistDraftListEntry,
    ]
  );

  const saveCurrentDraft = React.useCallback(async () => {
    if (!canPersistDraft) {
      setDraftStatus("Sign in to save drafts.");
      return;
    }

    if (activeDraftId) {
      await saveDraft("update", {
        name: activeDraftName?.trim() || draftName.trim() || "Untitled Draft",
        description: activeDraftDescription,
      });
      return;
    }

    setDraftName(activeDraftName ?? draftName);
    setDraftDescription(activeDraftDescription);
    setSaveDialogMode("create");
    setSaveDialogOpen(true);
  }, [
    activeDraftDescription,
    activeDraftId,
    activeDraftName,
    canPersistDraft,
    draftName,
    saveDraft,
  ]);

  const saveAsDraft = React.useCallback(() => {
    if (!canPersistDraft) {
      setDraftStatus("Sign in to save drafts.");
      return;
    }

    const suggestedName = activeDraftName?.trim()
      ? `${activeDraftName} Copy`
      : draftName.trim()
        ? `${draftName.trim()} Copy`
        : "Untitled Draft Copy";

    setDraftName(suggestedName);
    setDraftDescription(activeDraftDescription || draftDescription);
    setSaveDialogMode("save-as");
    setSaveDialogOpen(true);
  }, [
    activeDraftDescription,
    activeDraftName,
    canPersistDraft,
    draftDescription,
    draftName,
  ]);

  const deleteDraft = React.useCallback(async (draftId: string) => {
    setDraftActionId(draftId);

    try {
      const response = await fetch(`/api/custom-component-drafts/${draftId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string; success?: boolean };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to delete draft.");
      }

      setDrafts((current) => current.filter((item) => item.id !== draftId));

      if (activeDraftId === draftId) {
        setActiveDraftId(null);
        setActiveDraftName(null);
        setActiveDraftDescription("");
        setDraftStatus("Active draft deleted.");
      } else {
        setDraftStatus("Draft deleted.");
      }
    } catch (error) {
      setDraftStatus(getErrorMessage(error));
    } finally {
      setDraftActionId(null);
    }
  }, [activeDraftId]);

  const openDraftBrowser = React.useCallback(() => {
    setDraftBrowserOpen(true);

    if (canPersistDraft) {
      void loadDrafts();
    }
  }, [canPersistDraft, loadDrafts]);

  const exportJsonDocument = React.useCallback(() => {
    const payload = {
      kind: "custom-component-editor",
      version: 1,
      name: activeDraftName,
      description: activeDraftDescription || null,
      document: serializeEditorDocument(objects, background, connectionPoints),
    };

    downloadJsonFile(
      `${slugifyFilename(activeDraftName ?? "custom-component")}.json`,
      payload
    );
    setDraftStatus("JSON exported.");
  }, [activeDraftDescription, activeDraftName, background, connectionPoints, objects]);

  const importJsonDocument = React.useCallback(
    async (file: File) => {
      try {
        const raw = await file.text();
        const parsed = JSON.parse(raw) as {
          name?: unknown;
          description?: unknown;
          document?: unknown;
        };
        const documentSource =
          parsed && typeof parsed === "object" && "document" in parsed
            ? parsed.document
            : parsed;
        const normalized = normalizeEditorDocument(documentSource);
        const importedName =
          typeof parsed?.name === "string" && parsed.name.trim()
            ? parsed.name
            : getFilenameBase(file.name);
        const importedDescription =
          typeof parsed?.description === "string" ? parsed.description : null;

        handleDocumentLoaded(normalized, {
          id: null,
          name: importedName,
          description: importedDescription,
        });
        setDraftName(importedName);
        setDraftDescription(importedDescription ?? "");
        setAutosaveEnabled(false);
        setPendingAutosaveEnable(false);
        setDraftStatus(`Imported JSON "${file.name}".`);
      } catch (error) {
        setDraftStatus(getErrorMessage(error));
      }
    },
    [handleDocumentLoaded]
  );

  const handleAutosaveToggle = React.useCallback(
    (checked: boolean) => {
      if (!checked) {
        setAutosaveEnabled(false);
        setPendingAutosaveEnable(false);
        setDraftStatus("Autosave disabled.");
        return;
      }

      if (!canPersistDraft) {
        setDraftStatus("Sign in to use autosave.");
        return;
      }

      if (!activeDraftId) {
        setPendingAutosaveEnable(true);
        setDraftName(activeDraftName ?? "Autosave Draft");
        setDraftDescription(
          activeDraftDescription || "Created automatically by autosave every 5 minutes."
        );
        setSaveDialogOpen(true);
        setDraftStatus("Save draft first to enable autosave.");
        return;
      }

      setAutosaveEnabled(true);
      setPendingAutosaveEnable(false);
      setDraftStatus("Autosave enabled.");
    },
    [activeDraftDescription, activeDraftId, activeDraftName, canPersistDraft]
  );

  React.useEffect(() => {
    if (lastSavedSnapshotRef.current === null) {
      lastSavedSnapshotRef.current = documentSnapshot;
    }
  }, [documentSnapshot]);

  React.useEffect(() => {
    if (!initialTarget || importedInitialTargetRef.current) {
      return;
    }

    importDocument(initialTarget.document);
    setActiveDraftName(initialTarget.assetName);
    setDraftStatus(`Loaded asset "${initialTarget.assetName}" for editing.`);
    importedInitialTargetRef.current = true;
  }, [importDocument, initialTarget]);

  React.useEffect(() => {
    if (!autosaveEnabled || !activeDraftId || !canPersistDraft || isSavingDraft) {
      return;
    }

    if (documentSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveDraft(activeDraftId ? "update" : "create", {
        name: activeDraftName?.trim() || "Autosave Draft",
        description:
          activeDraftDescription.trim() ||
          "Created automatically by autosave every 5 minutes.",
        successMessage: activeDraftName
          ? `Autosaved "${activeDraftName}".`
          : "Autosaved draft.",
      });
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    activeDraftDescription,
    activeDraftId,
    activeDraftName,
    autosaveEnabled,
    canPersistDraft,
    documentSnapshot,
    isSavingDraft,
    saveDraft,
  ]);

  React.useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const tagName = target.tagName.toLowerCase();

      return (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target.isContentEditable
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        return;
      }

      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        if (selectedConnectionPointIds.length > 0) {
          deleteSelectedConnectionPoint();
        }
        if (selectedIds.length > 0) {
          deleteSelectedObject();
        }
        return;
      }

      if (selectedIds.length > 0) {
        const step = event.shiftKey ? 10 : 1;

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          moveSelectedObjects(-step, 0);
          return;
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          moveSelectedObjects(step, 0);
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          moveSelectedObjects(0, -step);
          return;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          moveSelectedObjects(0, step);
          return;
        }
      }

      if (!modifier) {
        return;
      }

      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }

      if (key === "s") {
        event.preventDefault();
        void saveCurrentDraft();
        return;
      }

      if (key === "c") {
        if (selectedObjects.length === 0) {
          return;
        }

        event.preventDefault();
        clipboardRef.current = selectedObjects.map((object) => cloneCanvasObject(object));
        return;
      }

      if (key === "d") {
        if (selectedIds.length === 0) {
          return;
        }

        event.preventDefault();
        duplicateSelectedObject();
        return;
      }

      if (key === "g") {
        if (selectedIds.length < 2) {
          return;
        }

        event.preventDefault();
        groupSelectedObjects();
        return;
      }

      if (key === "u") {
        if (selectedIds.length === 0) {
          return;
        }

        event.preventDefault();
        ungroupSelectedObjects();
        return;
      }

      if (key === "l") {
        if (selectedObjects.length === 0) {
          return;
        }

        event.preventDefault();
        setSelectedLocked(!selectedObjects.every((object) => object.locked));
        return;
      }

      if (key === "h") {
        if (selectedObjects.length === 0) {
          return;
        }

        event.preventDefault();
        setSelectedVisibility(!selectedObjects.every((object) => object.visible));
        return;
      }

      if (key === "z") {
        event.preventDefault();
        undo();
        return;
      }

      if (key === "y") {
        event.preventDefault();
        redo();
        return;
      }

      if (key === "v") {
        if (clipboardRef.current.length === 0) {
          return;
        }

        event.preventDefault();

        const pastedObjects = clipboardRef.current.map((object) => {
          const nextObject = cloneCanvasObject(object);
          const nextBounds = getObjectBounds(nextObject);
          const width = nextBounds.width;
          const height = nextBounds.height;

          nextObject.id = createEditorId(nextObject.type);
          nextObject.groupId = undefined;
          nextObject.name = `${object.name} Copy`;
          nextObject.x += Math.max(28, Math.round(width * 0.08));
          nextObject.y += Math.max(28, Math.round(height * 0.08));

          return nextObject;
        });

        clipboardRef.current = pastedObjects.map((object) => cloneCanvasObject(object));
        addObjects(pastedObjects);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    addObjects,
    deleteSelectedConnectionPoint,
    deleteSelectedObject,
    duplicateSelectedObject,
    groupSelectedObjects,
    moveSelectedObjects,
    redo,
    saveCurrentDraft,
    selectedConnectionPointIds,
    selectedIds,
    selectedObjects,
    setSelectedLocked,
    setSelectedVisibility,
    ungroupSelectedObjects,
    undo,
  ]);

  const handleImageUpload = React.useCallback(
    async (file: File) => {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Failed to read image."));
        reader.readAsDataURL(file);
      });

      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const nextImage = new window.Image();
        nextImage.onload = () => resolve(nextImage);
        nextImage.onerror = () => reject(new Error("Failed to load image."));
        nextImage.src = dataUrl;
      });

      const width = Math.max(120, Math.min(360, image.naturalWidth));
      const height = Math.max(
        120,
        Math.min(360, (image.naturalHeight / Math.max(image.naturalWidth, 1)) * width)
      );

      addObject(
        createImageObject({
          x: (240 - viewport.x) / viewport.scale,
          y: (160 - viewport.y) / viewport.scale,
          src: dataUrl,
          width,
          height,
          name: file.name.replace(/\.[^/.]+$/, "") || "Uploaded Image",
        })
      );
    },
    [addObject, viewport]
  );

  const handleNewCanvas = React.useCallback(() => {
    importDocument({
      version: 1,
      background: "#f8fafc",
      objects: [],
      connectionPoints: [],
    });
    setViewport({ x: 64, y: 40, scale: 1 });
    setActiveDraftId(null);
    setActiveDraftName(null);
    setActiveDraftDescription("");
    setDraftName("");
    setDraftDescription("");
    setAutosaveEnabled(false);
    setPendingAutosaveEnable(false);
    setDraftStatus("Started a new canvas.");
    markSnapshotAsSaved(
      JSON.stringify({
        version: 1,
        background: "#f8fafc",
        objects: [],
        connectionPoints: [],
      })
    );
  }, [importDocument, markSnapshotAsSaved, setViewport]);

  const handlePublish = React.useCallback(
    async (value: PublishSubmitValue) => {
      const exported = createPngExport();

      if (!exported) {
        setDraftStatus("Nothing to publish. Add at least one object to the canvas.");
        return;
      }

      setIsPublishing(true);

      try {
        const imageFile = await dataUrlToFile(exported.url, `${value.assetSlug ?? "custom-component"}.png`);
        const formData = new FormData();

        formData.append("publishType", value.publishType);
        formData.append("draftId", activeDraftId ?? "");
        formData.append("ownerType", initialTarget?.ownerType ?? "");
        formData.append("ownerId", initialTarget?.ownerId ?? "");
        formData.append("assetSlug", value.assetSlug ?? "");
        formData.append("styleType", value.styleType ?? "");
        formData.append("payloadJson", JSON.stringify(value.payload));
        formData.append(
          "editorDocumentJson",
          JSON.stringify(serializeEditorDocument(objects, background, connectionPoints))
        );
        formData.append(
          "connectionPointsJson",
          JSON.stringify(
            connectionPoints.map((point) => ({
              key: point.key,
              label: point.label,
              pointType: point.pointType,
              color: point.color,
              x: point.x,
              y: point.y,
              description: point.description,
            }))
          )
        );
        formData.append("width", String(exported.bounds.width));
        formData.append("height", String(exported.bounds.height));
        formData.append("originX", String(exported.bounds.x));
        formData.append("originY", String(exported.bounds.y));
        formData.append("imageFile", imageFile);

        const response = await fetch("/api/custom-component-publish", {
          method: "POST",
          body: formData,
        });
        const responseText = await response.text();
        let payload = {} as {
          error?: string;
          owner?: { name?: string };
          asset?: { name?: string };
        };

        if (responseText) {
          try {
            payload = JSON.parse(responseText) as typeof payload;
          } catch {
            payload = {};
          }
        }

        if (!response.ok) {
          throw new Error(
            payload.error ||
              responseText ||
              `Failed to publish custom component (${response.status}).`
          );
        }

        setDraftStatus(
          `Published ${payload.owner?.name ?? payload.asset?.name ?? "custom component"}.`
        );
      } catch (error) {
        setDraftStatus(getErrorMessage(error));
        throw error;
      } finally {
        setIsPublishing(false);
      }
    },
    [
      background,
      connectionPoints,
      createPngExport,
      activeDraftId,
      initialTarget,
      objects,
    ]
  );

  return (
    <div className="flex flex-1 flex-col overflow-visible">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          await handleImageUpload(file);
          event.target.value = "";
        }}
      />
      <input
        ref={importJsonInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];

          if (!file) {
            return;
          }

          await importJsonDocument(file);
          event.target.value = "";
        }}
      />
      <EditorTopbar
        canUndo={pastCount > 0}
        canRedo={futureCount > 0}
        canAlign={selectedItemCount > 1}
        zoom={viewport.scale}
        onUndo={undo}
        onRedo={redo}
        onAlign={alignSelectedObjects}
        onZoomIn={() => setViewport({ scale: clampZoom(viewport.scale + 0.1) })}
        onZoomOut={() => setViewport({ scale: clampZoom(viewport.scale - 0.1) })}
        onResetZoom={() => setViewport({ scale: 1 })}
        onExportPng={() => {
          const exported = createPngExport();
          if (exported?.url) {
            downloadDataUrl("custom-component.png", exported.url);
          }
        }}
        onNewCanvas={handleNewCanvas}
        onSaveDraft={() => {
          void saveCurrentDraft();
        }}
        onSaveAsDraft={saveAsDraft}
        onImportJson={() => importJsonInputRef.current?.click()}
        onExportJson={exportJsonDocument}
        onPublish={() => setPublishDialogOpen(true)}
        onOpenDrafts={openDraftBrowser}
        canSaveDraft={canPersistDraft}
        canPublish={objects.length > 0}
        publishBusy={isPublishing}
        draftBusy={isSavingDraft}
        currentDraftLabel={activeDraftName}
        autosaveEnabled={autosaveEnabled}
        onToggleAutosave={handleAutosaveToggle}
        statusText={
          draftStatus ??
          (sessionStatus === "loading"
            ? "Checking session..."
            : canPersistDraft
              ? null
              : "Draft saving requires sign-in.")
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-[112px_minmax(0,1fr)] overflow-hidden bg-background/95 xl:grid-cols-[112px_minmax(0,1fr)_340px]">
        <Toolbar onTriggerImageUpload={() => imageInputRef.current?.click()} />

        <div className="min-h-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.03),rgba(15,118,110,0.07))] p-4 sm:p-5">
          <CanvasEditor stageRef={stageRef} />
        </div>

        <div className="min-h-0 overflow-auto border-l border-border/70 bg-background/95 p-4">
          <div className="flex flex-col gap-4">
            <PropertiesPanel />
            <LayersPanel />
          </div>
        </div>
      </div>

      <PublishDialog
        key={`${publishDialogOpen}-${initialTarget?.ownerType ?? "new"}-${initialTarget?.ownerId ?? "draft"}-${activeDraftName ?? "draft"}-${connectionPoints.length}`}
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        suggestedName={initialTarget?.assetName ?? activeDraftName ?? "Custom Component"}
        suggestedSlug={(
          initialTarget?.assetSlug ??
          activeDraftName ??
          "custom-component"
        )
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")}
        connectionPointCount={connectionPoints.length}
        initialTarget={initialTarget}
        onSubmit={handlePublish}
      />

      <Dialog
        open={saveDialogOpen}
        onOpenChange={(open) => {
          setSaveDialogOpen(open);

          if (!open && pendingAutosaveEnable) {
            setPendingAutosaveEnable(false);
          }

          if (!open) {
            setSaveDialogMode("create");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{saveDialogMode === "save-as" ? "Save As" : "Save Draft"}</DialogTitle>
            <DialogDescription>
              {saveDialogMode === "save-as"
                ? "Simpan salinan draft custom component sebagai file baru."
                : "Simpan draft custom component ke database user yang sedang login."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 px-6 pb-2">
            <div className="grid gap-1.5">
              <label htmlFor="draft-name" className="text-sm font-medium text-foreground">
                Draft name
              </label>
              <Input
                id="draft-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Mis. Humbucker base v1"
              />
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="draft-description"
                className="text-sm font-medium text-foreground"
              >
                Description
              </label>
              <textarea
                id="draft-description"
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                placeholder="Catatan singkat perubahan atau tujuan draft ini."
                className="min-h-24 rounded-md border border-input bg-input/20 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isSavingDraft}
              onClick={() => {
                void saveDraft(
                  saveDialogMode === "save-as"
                    ? "save-as"
                    : activeDraftId
                      ? "update"
                      : "create"
                );
              }}
            >
              {isSavingDraft ? "Saving..." : saveDialogMode === "save-as" ? "Save As" : "Save Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSavingDraft} onOpenChange={() => undefined}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader className="items-center text-center">
            <DialogTitle>Saving Draft</DialogTitle>
            <DialogDescription>
              Mohon tunggu. Draft custom component sedang disimpan.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={draftBrowserOpen} onOpenChange={setDraftBrowserOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Draft Database</DialogTitle>
            <DialogDescription>
              Muat ulang, review, atau hapus draft custom component yang tersimpan.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 px-6 pb-2">
            <div className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <span>
                {session?.user?.email
                  ? `Signed in as ${session.user.email}`
                  : "No active session."}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!canPersistDraft || isLoadingDrafts}
                onClick={() => {
                  void loadDrafts();
                }}
              >
                {isLoadingDrafts ? "Refreshing..." : "Refresh"}
              </Button>
            </div>

            <div className="max-h-96 overflow-auto rounded-md border border-border/70">
              {drafts.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {isLoadingDrafts
                    ? "Loading drafts..."
                    : "Belum ada draft tersimpan untuk user ini."}
                </div>
              ) : (
                <div className="divide-y divide-border/70">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {draft.name}
                        </div>
                        {draft.description ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {draft.description}
                          </div>
                        ) : null}
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          Updated {new Date(draft.updatedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={draftActionId === draft.id}
                          onClick={() => {
                            handleDocumentLoaded(
                              normalizeEditorDocument(draft.documentJson),
                              {
                                id: draft.id,
                                name: draft.name,
                                description: draft.description,
                              }
                            );
                            setDraftBrowserOpen(false);
                          }}
                        >
                          Load
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={draftActionId === draft.id}
                          onClick={() => {
                            void deleteDraft(draft.id);
                          }}
                        >
                          {draftActionId === draft.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
