"use client";

import { useEffect } from "react";
import { EmptyState } from "@/components/ui/ui";

export default function PanelError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-line bg-surface">
      <EmptyState
        icon="alert"
        title="No pudimos cargar esta pantalla"
        description="Ocurrió un error al preparar los datos. Puedes intentarlo de nuevo."
        action={
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-lg bg-sage-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-sage-900"
          >
            Reintentar
          </button>
        }
      />
    </div>
  );
}
