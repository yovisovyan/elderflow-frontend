"use client";

import { useParams, useRouter } from "next/navigation";
import ProtectedLayout from "../../../protected-layout";
import { AddActivityForm } from "../../../activities/components/AddActivityForm";
import { Button } from "../../../components/ui/Button";


export default function AddActivityForClientPage() {
  const params = useParams<{ clientId: string }>();
  const router = useRouter();
  const clientId = params.clientId;

  return (
    <ProtectedLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Add Activity for Client</h1>
            <p className="text-sm text-slate-600">
              Log time for this specific client. The client is pre-selected and cannot be changed.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push(`/clients/${clientId}`)}
            className="text-xs"
          >
            ← Back to client
          </Button>
        </div>

        <AddActivityForm
          initialClientId={clientId}
          redirectTo={`/clients/${clientId}`}
        />
      </div>
    </ProtectedLayout>
  );
}
