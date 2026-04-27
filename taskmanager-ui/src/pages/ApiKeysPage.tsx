import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Copy, KeyRound, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getApiErrorMessage } from "../api/client";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Input } from "../components/ui/Input";
import { EmptyState, LoadingBlock } from "../components/ui/Loading";
import { Modal } from "../components/ui/Modal";
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "../hooks/useApiKeys";
import type { ApiKeyListResponse, ApiKeyResponse } from "../types/api";
import { formatDate } from "../utils/formatDate";

const schema = z.object({ name: z.string().min(1, "Key name is required") });

export function ApiKeysPage() {
  const keys = useApiKeys();
  const createMutation = useCreateApiKey();
  const revokeMutation = useRevokeApiKey();
  const [newKey, setNewKey] = useState<ApiKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [toRevoke, setToRevoke] = useState<ApiKeyListResponse | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      const key = await createMutation.mutateAsync(values);
      setNewKey(key);
      setCopied(false);
      form.reset({ name: "" });
      toast.success("API key created");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not create API key"));
    }
  }

  async function copyKey() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey.key);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {/* Create form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Create API key</h2>
          <p className="text-sm text-muted-foreground">Raw key is shown exactly once after creation.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="label" htmlFor="api-key-name">
                Key name
              </label>
              <Input
                id="api-key-name"
                placeholder="e.g. CI pipeline, Local dev"
                {...form.register("name")}
              />
              {form.formState.errors.name ? (
                <p className="field-error">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="w-full">
              <KeyRound className="h-4 w-4" />
              {createMutation.isPending ? "Creating…" : "Generate key"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Key list */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Your API keys</h2>
          <p className="text-sm text-muted-foreground">Revoke keys that are no longer needed.</p>
        </CardHeader>
        <CardContent>
          {keys.isError ? <Alert>{getApiErrorMessage(keys.error, "Could not load API keys")}</Alert> : null}
          {keys.isLoading ? <LoadingBlock /> : null}
          {!keys.isLoading && !keys.isError && !keys.data?.length ? (
            <EmptyState message="No API keys yet. Generate your first key using the form." />
          ) : null}
          <div className="space-y-3">
            {(keys.data || []).map((key) => (
              <div
                key={key.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-semibold">{key.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Created {formatDate(key.created_at)}
                    {key.last_used_at ? ` · Last used ${formatDate(key.last_used_at)}` : " · Never used"}
                  </div>
                </div>
                <Button
                  variant="danger"
                  className="h-8 shrink-0 px-3 text-xs"
                  onClick={() => setToRevoke(key)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New key reveal modal */}
      <Modal open={Boolean(newKey)} title="Your new API key" onClose={() => setNewKey(null)}>
        {newKey ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Copy this key now. For security reasons, it <strong>will not be shown again</strong> after you close this dialog.
              </p>
            </div>
            <div className="rounded-lg border bg-muted p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {newKey.name}
              </div>
              <code className="break-all text-sm font-mono">{newKey.key}</code>
            </div>
            <Button className="w-full" onClick={copyKey}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy key"}
            </Button>
          </div>
        ) : null}
      </Modal>

      {/* Revoke confirm */}
      <ConfirmDialog
        open={Boolean(toRevoke)}
        title={`Revoke "${toRevoke?.name}"?`}
        description="Any scripts or services using this key will immediately lose access. This cannot be undone."
        confirmLabel="Revoke key"
        onCancel={() => setToRevoke(null)}
        onConfirm={async () => {
          if (!toRevoke) return;
          try {
            await revokeMutation.mutateAsync(toRevoke.id);
            toast.success("API key revoked");
          } catch (error) {
            toast.error(getApiErrorMessage(error, "Could not revoke API key"));
          } finally {
            setToRevoke(null);
          }
        }}
      />
    </div>
  );
}
