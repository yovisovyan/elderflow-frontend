"use client";

import { useRouter } from "next/navigation";

export default function AddClientButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/clients/new")}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    >
      + Add Client
    </button>
  );
}
