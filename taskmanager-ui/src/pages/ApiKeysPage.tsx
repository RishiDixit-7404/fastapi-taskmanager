import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, KeyRound, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getApiErrorMessage } from "../api/client";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { EmptyState, LoadingBlock } from "../components/ui/Loading";
import { Modal } from "../components/ui/Modal";
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "../hooks/useApiKeys";
import type { ApiKeyResponse } from "../types/api";
import { formatDate } from "../utils/formatDate";

const schema = z.object({ name: z.string().min(1, "Key name is required") });

export function ApiKeysPage() {
  const keys = useApiKeys();
  const createMutation = useCreateApiKey();
  const revokeMutation = useRevokeApiKey();
  const [newKey, setNewKey] = useState<ApiKeyResponse | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      const key = await createMutation.mutateAsync(values);
      setNewKey(key);
      form.reset({ name: "" });
      toast.success("API key created");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not create API key"));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Create API key</h2>
          <p className="text-sm text-muted-foreground">Raw keys are shown once after creation.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="label" htmlFor="api-key-name">
                Name
              </label>
              <Input id="api-key-name" {...form.register("name")} />
              {form.formState.errors.name ? <p className="field-error">{form.formState.errors.name.message}</p> : null}
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              <KeyRound className="h-4 w-4" />
              {createMutation.isPending ? "Creating..." : "Create key"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">API keys</h2>
          <p className="text-sm text-muted-foreground">Revoke keys that are no longer needed.</p>
        </CardHeader>
        <CardContent>
          {keys.isLoading ? <LoadingBlock /> : null}
          {!keys.isLoading && !keys.data?.length ? <EmptyState message="No API keys yet." /> : null}
          <div className="space-y-3">
            {(keys.data || []).map((key) => (
              <div key={key.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold">{key.name}</div>
                  <div className="text-sm text-muted-foreground">Created {formatDate(key.created_at)}</div>
                  <div className="text-sm text-muted-foreground">Last used {formatDate(key.last_used_at)}</div>
                </div>
                <Button
                  variant="danger"
                  onClick={async () => {
                    if (!window.confirm(`Revoke API key "${key.name}"?`)) return;
                    try {
                      await revokeMutation.mutateAsync(key.id);
                      toast.success("API key revoked");
                    } catch (error) {
                      toast.error(getApiErrorMessage(error, "Could not revoke API key"));
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal open={Boolean(newKey)} title="New API key" onClose={() => setNewKey(null)}>
        {newKey ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Copy this key now. It will not be shown again.</p>
            <div className="rounded-lg border bg-muted p-3">
              <div className="mb-2 font-semibold">{newKey.name}</div>
              <code className="break-all text-sm">{newKey.key}</code>
            </div>
            <Button
              onClick={async () => {
                await navigator.clipboard.writeText(newKey.key);
                toast.success("Copied to clipboard");
              }}
            >
              <Copy className="h-4 w-4" />
              Copy key
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
