"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IntakePayload } from "@/lib/agent/types";
import { V1_STATES } from "@/lib/corpus/manifest";

type FormState = Partial<IntakePayload>;

const STEPS = [
  "Where was the property?",
  "Rent and deposit",
  "What happened?",
  "Timing",
  "Evidence you have",
  "Anything in your own words?",
] as const;

type StepProps = {
  data: FormState;
  set: <K extends keyof IntakePayload>(k: K, v: IntakePayload[K]) => void;
};

export function IntakeForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormState>({
    evidence_available: [],
    last_communication_date: null,
    free_text_context: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set: StepProps["set"] = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const nextEnabled = validators[step](data);

  async function submit() {
    setError(null);
    setSubmitting(true);
    const parsed = IntakePayload.safeParse(data);
    if (!parsed.success) {
      setError("Please check your answers — some fields are missing or invalid.");
      setSubmitting(false);
      return;
    }
    sessionStorage.setItem("recourse:intake", JSON.stringify(parsed.data));
    router.push("/processing");
  }

  return (
    <main className="min-h-dvh max-w-2xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center text-sm text-[color:var(--color-ink-muted)]">
        <span className="text-xl font-medium text-[color:var(--color-ink)]">Recourse</span>
        <span>
          Step {step + 1} of {STEPS.length}
        </span>
      </div>
      <div className="mt-4 flex gap-2" aria-label="Progress">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${
              i <= step
                ? "bg-[color:var(--color-ink)]"
                : "border border-[color:var(--color-ink-muted)]"
            }`}
          />
        ))}
      </div>

      <h1 className="mt-10 text-3xl font-medium">{STEPS[step]}</h1>

      <div className="mt-8">
        {step === 0 && <StepState data={data} set={set} />}
        {step === 1 && <StepMoney data={data} set={set} />}
        {step === 2 && <StepSituation data={data} set={set} />}
        {step === 3 && <StepTiming data={data} set={set} />}
        {step === 4 && <StepEvidence data={data} set={set} />}
        {step === 5 && <StepFreeText data={data} set={set} />}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-16 flex justify-between">
        <button
          type="button"
          className="text-[color:var(--color-ink-muted)] disabled:opacity-40"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || submitting}
        >
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="px-5 py-3 rounded-lg bg-[color:var(--color-ink)] text-white disabled:opacity-40"
            disabled={!nextEnabled}
            onClick={() => setStep((s) => s + 1)}
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            className="px-5 py-3 rounded-lg bg-[color:var(--color-ink)] text-white disabled:opacity-40"
            disabled={!nextEnabled || submitting}
            onClick={submit}
          >
            {submitting ? "Submitting…" : "Draft my notice"}
          </button>
        )}
      </div>
    </main>
  );
}

const validators: Array<(d: FormState) => boolean> = [
  (d) => Boolean(d.state && d.city),
  (d) =>
    Boolean(
      d.monthly_rent_inr && d.deposit_paid_inr && d.tenancy_start && d.tenancy_end,
    ),
  (d) => Boolean(d.situation_type_user_selected),
  (d) => typeof d.days_since_vacation === "number",
  (d) => Array.isArray(d.evidence_available),
  () => true,
];

function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm text-[color:var(--color-ink-muted)] mb-2"
    >
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full h-12 px-4 rounded-lg bg-white border border-[color:var(--color-hairline)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ink)] ${className}`}
    />
  );
}

function Select({
  children,
  ...p
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...p}
      className="w-full h-12 px-4 rounded-lg bg-white border border-[color:var(--color-hairline)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ink)]"
    >
      {children}
    </select>
  );
}

function StepState({ data, set }: StepProps) {
  const options = [...V1_STATES, "Rajasthan", "Delhi", "Tamil Nadu", "Other"];
  return (
    <div className="space-y-6 max-w-md">
      <div>
        <Label htmlFor="state">State</Label>
        <Select
          id="state"
          value={data.state ?? ""}
          onChange={(e) => set("state", e.target.value)}
        >
          <option value="">Select…</option>
          {options.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={data.city ?? ""}
          onChange={(e) => set("city", e.target.value)}
          placeholder="Bangalore"
        />
      </div>
      <p className="text-xs text-[color:var(--color-ink-faint)]">
        We use this to pick the right state rent law.
      </p>
    </div>
  );
}

function StepMoney({ data, set }: StepProps) {
  return (
    <div className="space-y-6 max-w-md">
      <div>
        <Label htmlFor="rent">Monthly rent (₹)</Label>
        <Input
          id="rent"
          type="number"
          min={1}
          value={data.monthly_rent_inr ?? ""}
          onChange={(e) => set("monthly_rent_inr", Number(e.target.value))}
        />
      </div>
      <div>
        <Label htmlFor="dep">Deposit paid (₹)</Label>
        <Input
          id="dep"
          type="number"
          min={1}
          value={data.deposit_paid_inr ?? ""}
          onChange={(e) => set("deposit_paid_inr", Number(e.target.value))}
        />
      </div>
      <div>
        <Label htmlFor="ts">Tenancy start</Label>
        <Input
          id="ts"
          type="date"
          value={data.tenancy_start ?? ""}
          onChange={(e) => set("tenancy_start", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="te">Tenancy end</Label>
        <Input
          id="te"
          type="date"
          value={data.tenancy_end ?? ""}
          onChange={(e) => set("tenancy_end", e.target.value)}
        />
      </div>
    </div>
  );
}

function StepSituation({ data, set }: StepProps) {
  const OPTIONS = [
    ["not_returned", "Landlord has not returned any of the deposit"],
    ["partial_vague_deductions", "Partial refund with vague, unitemized deductions"],
    ["partial_itemized_disputed", "Partial refund with itemized deductions I dispute"],
    ["landlord_unreachable", "Landlord is unreachable / not responding"],
    ["landlord_counter_claiming", "Landlord is counter-claiming for damages"],
  ] as const;
  return (
    <div className="space-y-3 max-w-xl">
      {OPTIONS.map(([v, label]) => (
        <label
          key={v}
          className="flex items-start gap-3 p-4 rounded-lg border border-[color:var(--color-hairline)] bg-white cursor-pointer hover:bg-[color:var(--color-panel)] has-[:checked]:border-[color:var(--color-ink)]"
        >
          <input
            type="radio"
            name="sit"
            value={v}
            checked={data.situation_type_user_selected === v}
            onChange={() =>
              set(
                "situation_type_user_selected",
                v as IntakePayload["situation_type_user_selected"],
              )
            }
            className="mt-1"
          />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}

function StepTiming({ data, set }: StepProps) {
  return (
    <div className="space-y-6 max-w-md">
      <div>
        <Label htmlFor="dsv">Days since you vacated</Label>
        <Input
          id="dsv"
          type="number"
          min={0}
          value={data.days_since_vacation ?? ""}
          onChange={(e) => set("days_since_vacation", Number(e.target.value))}
        />
      </div>
      <div>
        <Label htmlFor="lcd">Last communication with landlord (optional)</Label>
        <Input
          id="lcd"
          type="date"
          value={data.last_communication_date ?? ""}
          onChange={(e) =>
            set("last_communication_date", (e.target.value || null) as string | null)
          }
        />
      </div>
    </div>
  );
}

function StepEvidence({ data, set }: StepProps) {
  const OPTIONS = [
    ["rent_agreement", "Written rent agreement"],
    ["bank_transfer_proof", "Bank transfer proof of deposit"],
    ["whatsapp_email", "WhatsApp or email with landlord"],
    ["joint_inspection_report", "Joint move-out inspection report"],
    ["move_out_photos", "Photos/videos of move-out condition"],
    ["rent_receipts", "Rent receipts"],
  ] as const;
  const selected: string[] = data.evidence_available ?? [];
  const toggle = (v: string) => {
    const has = selected.includes(v);
    set(
      "evidence_available",
      (has
        ? selected.filter((x) => x !== v)
        : [...selected, v]) as IntakePayload["evidence_available"],
    );
  };
  return (
    <div className="space-y-2 max-w-xl">
      {OPTIONS.map(([v, label]) => (
        <label
          key={v}
          className="flex items-center gap-3 p-3 rounded-lg border border-[color:var(--color-hairline)] bg-white cursor-pointer has-[:checked]:border-[color:var(--color-ink)]"
        >
          <input
            type="checkbox"
            checked={selected.includes(v)}
            onChange={() => toggle(v)}
          />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}

function StepFreeText({ data, set }: StepProps) {
  return (
    <div className="max-w-xl">
      <Label htmlFor="ft">
        Add anything else in your own words (max 500 chars — do not include the
        landlord&apos;s name/address here; only in the final downloaded draft)
      </Label>
      <textarea
        id="ft"
        maxLength={500}
        value={data.free_text_context ?? ""}
        onChange={(e) =>
          set("free_text_context", (e.target.value || null) as string | null)
        }
        className="w-full h-40 p-4 rounded-lg bg-white border border-[color:var(--color-hairline)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ink)]"
      />
    </div>
  );
}
