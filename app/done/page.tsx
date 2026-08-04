import { Suspense } from "react";
import { Done } from "./Done";

export default function DonePage() {
  return (
    <Suspense fallback={<main className="p-10">Loading…</main>}>
      <Done />
    </Suspense>
  );
}
