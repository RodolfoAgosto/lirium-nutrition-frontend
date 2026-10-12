"use client";

import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { api, type FoodSummary, type MeasureUnit, type RecordMeal } from "@/lib/api";
import { describeError } from "@/lib/errors";
import { cn, humanize } from "@/lib/utils";

const UNIT_SHORT: Record<MeasureUnit, string> = { GRAM: "g", MILLILITER: "ml", UNIT: "u" };
const UNIT_LABEL: Record<MeasureUnit, string> = { GRAM: "Grams (g)", MILLILITER: "Milliliters (ml)", UNIT: "Units" };
const UNITS: MeasureUnit[] = ["GRAM", "MILLILITER", "UNIT"];

const controlClasses =
  "w-full rounded-md border border-border bg-surface px-3 text-[15px] text-foreground " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

type Props = {
  meal: RecordMeal;
  dailyRecordId: number;
  foods: FoodSummary[] | null;
  foodsError: string;
  onNeedFoods: () => void;
  // The API returns the whole meal after adding food or saving a note.
  onMealChange: (meal: RecordMeal) => void;
  // Removing food answers 204, so the day is read again to show what the server kept.
  onRefreshDay: () => Promise<void>;
};

export function MealCard({ meal, dailyRecordId, foods, foodsError, onNeedFoods, onMealChange, onRefreshDay }: Props) {
  const [panel, setPanel] = useState<"none" | "food" | "note">("none");
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);

  const kcal = meal.portions.reduce((sum, p) => sum + p.calories, 0);

  async function handleRemove(portionId: number) {
    setRemovingId(portionId);
    setError("");
    try {
      await api.removePortion(dailyRecordId, meal.id, portionId);
      await onRefreshDay();
    } catch (e) {
      setError(describeError(e));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-5 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold">{humanize(meal.type)}</h3>
          <span
            className={cn(
              "inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold",
              meal.overridden ? "bg-accent/20 text-foreground" : "bg-primary/10 text-primary",
            )}
          >
            {meal.overridden ? "Modified" : "As planned"}
          </span>
        </div>
        <span className="text-sm text-muted">{kcal} kcal</span>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {meal.portions.length === 0 ? (
        <p className="text-[15px] text-muted">Nothing recorded for this meal.</p>
      ) : (
        <ul className="divide-y divide-border">
          {meal.portions.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-[15px]">
              <span>{p.foodName}</span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-muted">
                  {Math.round(p.quantity * 10) / 10} {UNIT_SHORT[p.unit] ?? p.unit} · {p.calories} kcal
                </span>
                <button
                  onClick={() => handleRemove(p.id)}
                  disabled={removingId !== null}
                  aria-label={`Remove ${p.foodName}`}
                  className="min-h-9 rounded-md px-2 text-sm text-danger hover:bg-danger/5 disabled:opacity-60"
                >
                  {removingId === p.id ? "Removing…" : "Remove"}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {meal.notes && panel !== "note" && (
        <p className="rounded-md bg-background px-3 py-2 text-sm text-muted">
          <span className="font-semibold text-foreground">Note:</span> {meal.notes}
        </p>
      )}

      {panel === "none" && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onNeedFoods();
              setPanel("food");
            }}
          >
            Add food
          </Button>
          <Button variant="ghost" onClick={() => setPanel("note")}>
            {meal.notes ? "Edit note" : "Add note"}
          </Button>
        </div>
      )}

      {panel === "food" && (
        <AddFoodForm
          meal={meal}
          foods={foods}
          foodsError={foodsError}
          onDone={(updated) => {
            if (updated) onMealChange(updated);
            setPanel("none");
          }}
        />
      )}

      {panel === "note" && (
        <NoteForm
          meal={meal}
          onDone={(updated) => {
            if (updated) onMealChange(updated);
            setPanel("none");
          }}
        />
      )}
    </Card>
  );
}

function AddFoodForm({
  meal,
  foods,
  foodsError,
  onDone,
}: {
  meal: RecordMeal;
  foods: FoodSummary[] | null;
  foodsError: string;
  onDone: (updated: RecordMeal | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [food, setFood] = useState<FoodSummary | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<MeasureUnit>("GRAM");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!foods || !q) return [];
    return foods.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 6);
  }, [foods, query]);

  // The API keeps one portion per food and unit: adding it again replaces the amount.
  const replaces = !!food && meal.portions.some((p) => p.foodName === food.name && p.unit === unit);

  function pick(f: FoodSummary) {
    setFood(f);
    setUnit(f.defaultUnit ?? "GRAM");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(quantity);
    if (!food) return setError("Choose a food first.");
    if (!quantity || !Number.isFinite(amount) || amount <= 0) return setError("Enter an amount greater than zero.");
    setSaving(true);
    setError("");
    try {
      onDone(await api.addPortion(meal.id, { foodId: food.id, quantity: amount, unit }));
    } catch (err) {
      setError(describeError(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border bg-background p-4">
      {foodsError && <Alert tone="error">{foodsError}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      {food ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[15px] font-semibold">{food.name}</span>
          <button type="button" onClick={() => setFood(null)} className="text-sm text-primary hover:underline">
            Change
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Field
            label="Search food"
            name={`food-search-${meal.id}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={foods ? "e.g. banana" : "Loading foods…"}
            autoComplete="off"
          />
          {query.trim() && foods && matches.length === 0 && <p className="text-sm text-muted">No foods match.</p>}
          {matches.length > 0 && (
            <ul className="divide-y divide-border rounded-md border border-border bg-surface">
              {matches.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => pick(f)}
                    className="flex min-h-11 w-full items-center px-3 text-left text-[15px] hover:bg-background"
                  >
                    {f.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {food && (
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Amount"
            name={`food-qty-${meal.id}`}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`food-unit-${meal.id}`} className="text-sm font-medium text-foreground">
              Unit
            </label>
            <select
              id={`food-unit-${meal.id}`}
              value={unit}
              onChange={(e) => setUnit(e.target.value as MeasureUnit)}
              className={cn(controlClasses, "h-11")}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABEL[u]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {replaces && (
        <p className="text-[13px] text-muted">This food is already in the meal: saving sets its amount to the new value.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={saving} disabled={!food}>
          {replaces ? "Set amount" : "Add"}
        </Button>
        <Button type="button" variant="ghost" disabled={saving} onClick={() => onDone(null)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function NoteForm({ meal, onDone }: { meal: RecordMeal; onDone: (updated: RecordMeal | null) => void }) {
  const [notes, setNotes] = useState(meal.notes ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!notes.trim()) return setError("Write something before saving.");
    setSaving(true);
    setError("");
    try {
      onDone(await api.updateMealNotes(meal.id, notes.trim()));
    } catch (err) {
      setError(describeError(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-md border border-border bg-background p-4">
      {error && <Alert tone="error">{error}</Alert>}
      <label htmlFor={`note-${meal.id}`} className="text-sm font-medium text-foreground">
        Note
      </label>
      <textarea
        id={`note-${meal.id}`}
        rows={3}
        maxLength={500}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What was different from the plan?"
        className={cn(controlClasses, "py-2")}
      />
      <p className="text-[13px] text-muted">Saving a note marks the meal as modified.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={saving}>
          Save note
        </Button>
        <Button type="button" variant="ghost" disabled={saving} onClick={() => onDone(null)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
