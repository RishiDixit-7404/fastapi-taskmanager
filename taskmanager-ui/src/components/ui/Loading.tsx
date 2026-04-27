export function LoadingBlock() {
  return (
    <div className="space-y-3">
      <div className="h-5 w-40 animate-pulse rounded bg-muted" />
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/35 px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
