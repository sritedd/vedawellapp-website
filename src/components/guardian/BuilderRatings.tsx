"use client";

import { useState, useEffect, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BuilderRatingsProps {
  projectId: string;
  builderName?: string;
  builderLicense?: string;
  stateCode?: string;
}

interface CategoryRating {
  label: string;
  key: string;
  value: number;
}

interface SavedReview {
  overall: number;
  categories: Record<string, number>;
  text: string;
  recommend: boolean | null;
  submittedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FILLED_STAR = "\u2605";
const EMPTY_STAR = "\u2606";

const CATEGORY_DEFAULTS: CategoryRating[] = [
  { label: "Communication & Responsiveness", key: "communication", value: 0 },
  { label: "Quality of Workmanship", key: "workmanship", value: 0 },
  { label: "Timeline Adherence", key: "timeline", value: 0 },
  { label: "Cost Transparency", key: "cost", value: 0 },
  { label: "Problem Resolution", key: "resolution", value: 0 },
];

const RATING_GUIDELINES: { stars: number; description: string }[] = [
  { stars: 5, description: "Exceptional \u2014 would enthusiastically recommend" },
  { stars: 4, description: "Good \u2014 minor issues but overall positive" },
  { stars: 3, description: "Average \u2014 met minimum expectations" },
  { stars: 2, description: "Below average \u2014 significant issues" },
  { stars: 1, description: "Poor \u2014 would not recommend" },
];

const STATE_REGISTRIES: Record<string, string> = {
  NSW: "https://www.onegov.nsw.gov.au/publicregister/#/search/Builders",
  VIC: "https://www.vba.vic.gov.au/tools/register-search",
  QLD: "https://www.qbcc.qld.gov.au/licence-search",
  SA: "https://www.sa.gov.au/topics/planning-and-property/building-and-renovating",
  WA: "https://www.commerce.wa.gov.au/building-and-energy/register-searches",
  TAS: "https://www.cbos.tas.gov.au/topics/licensing-and-registration/occupational-licensing",
  NT: "https://nt.gov.au/industry/licences/apply-for-a-building-licence",
  ACT: "https://www.accesscanberra.act.gov.au/s/",
};

/* ------------------------------------------------------------------ */
/*  Helper: localStorage key                                           */
/* ------------------------------------------------------------------ */

function storageKey(projectId: string): string {
  return `builder-review-${projectId}`;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StarRow({
  rating,
  onChange,
  size = "text-2xl",
  readonly = false,
}: {
  rating: number;
  onChange?: (v: number) => void;
  size?: string;
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState<number>(0);

  return (
    <span className="inline-flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hovered || rating);
        return (
          <button
            key={n}
            type="button"
            disabled={readonly}
            className={`${size} transition-colors select-none ${
              filled ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
            } ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
            onMouseEnter={() => !readonly && setHovered(n)}
            onClick={() => onChange?.(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            {filled ? FILLED_STAR : EMPTY_STAR}
          </button>
        );
      })}
    </span>
  );
}

function PlaceholderBar({ width }: { width: string }) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className="h-3 rounded-full bg-gray-200 dark:bg-gray-700"
        style={{ width }}
      />
      <span className="text-xs text-muted-foreground">--</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function BuilderRatings({
  projectId,
  builderName,
  builderLicense,
  stateCode,
}: BuilderRatingsProps) {
  /* ---- state ---- */
  const [overall, setOverall] = useState<number>(0);
  const [categories, setCategories] = useState<CategoryRating[]>(
    CATEGORY_DEFAULTS.map((c) => ({ ...c }))
  );
  const [reviewText, setReviewText] = useState<string>("");
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [saved, setSaved] = useState<SavedReview | null>(null);
  const [showThankYou, setShowThankYou] = useState<boolean>(false);
  const [showGuidelines, setShowGuidelines] = useState<boolean>(false);

  /* ---- load from localStorage ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(projectId));
      if (raw) {
        const parsed: SavedReview = JSON.parse(raw);
        setSaved(parsed);
        setOverall(parsed.overall);
        setCategories((prev) =>
          prev.map((c) => ({
            ...c,
            value: parsed.categories[c.key] ?? 0,
          }))
        );
        setReviewText(parsed.text);
        setRecommend(parsed.recommend);
      }
    } catch {
      /* corrupt data — ignore */
    }
  }, [projectId]);

  /* ---- handlers ---- */
  const setCategoryRating = useCallback((key: string, value: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.key === key ? { ...c, value } : c))
    );
  }, []);

  const canSubmit =
    overall > 0 &&
    categories.every((c) => c.value > 0) &&
    reviewText.trim().length >= 50 &&
    recommend !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const review: SavedReview = {
      overall,
      categories: Object.fromEntries(categories.map((c) => [c.key, c.value])),
      text: reviewText.trim(),
      recommend,
      submittedAt: new Date().toISOString(),
    };
    localStorage.setItem(storageKey(projectId), JSON.stringify(review));
    setSaved(review);
    setShowThankYou(true);
    setTimeout(() => setShowThankYou(false), 4000);
  };

  const handleClear = () => {
    localStorage.removeItem(storageKey(projectId));
    setSaved(null);
    setOverall(0);
    setCategories(CATEGORY_DEFAULTS.map((c) => ({ ...c })));
    setReviewText("");
    setRecommend(null);
  };

  const registryUrl = stateCode ? STATE_REGISTRIES[stateCode] : null;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* ---- Builder Profile Card ---- */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-3">Builder Profile</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 space-y-1">
            <p className="font-medium text-base">
              {builderName || "Builder not specified"}
            </p>
            {builderLicense && (
              <p className="text-sm text-muted-foreground">
                Licence: {builderLicense}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {stateCode && (
              <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {stateCode}
              </span>
            )}
            {registryUrl && builderLicense && (
              <a
                href={registryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 underline hover:no-underline"
              >
                Verify Licence
              </a>
            )}
          </div>
        </div>

        {saved && (
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Your rating:</span>
            <StarRow rating={saved.overall} readonly size="text-lg" />
            <span className="text-sm font-medium ml-1">
              {saved.overall}/5
            </span>
          </div>
        )}
      </section>

      {/* ---- Your Review Form ---- */}
      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {saved ? "Your Review" : "Rate Your Builder"}
          </h2>
          {saved && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-red-500 hover:text-red-600 underline"
            >
              Clear & re-rate
            </button>
          )}
        </div>

        {showThankYou && (
          <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-300">
            Thank you for submitting your review. Your feedback has been saved locally.
          </div>
        )}

        {/* Overall */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-2">
            Overall Rating
          </label>
          <StarRow
            rating={overall}
            onChange={(v) => setOverall(v)}
            size="text-3xl"
            readonly={!!saved}
          />
          {overall > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {RATING_GUIDELINES.find((g) => g.stars === overall)?.description}
            </p>
          )}
        </div>

        {/* Category Ratings */}
        <div className="mb-5 space-y-3">
          <p className="text-sm font-medium">Category Ratings</p>
          {categories.map((cat) => (
            <div
              key={cat.key}
              className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"
            >
              <span className="text-sm text-muted-foreground sm:w-56 shrink-0">
                {cat.label}
              </span>
              <StarRow
                rating={cat.value}
                onChange={(v) => setCategoryRating(cat.key, v)}
                size="text-xl"
                readonly={!!saved}
              />
            </div>
          ))}
        </div>

        {/* Written review */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">
            Written Review
          </label>
          <textarea
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your experience with this builder (min. 50 characters)..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            disabled={!!saved}
            maxLength={2000}
          />
          <p
            className={`text-xs mt-1 ${
              reviewText.trim().length > 0 && reviewText.trim().length < 50
                ? "text-red-500"
                : "text-muted-foreground"
            }`}
          >
            {reviewText.trim().length}/50 min characters
          </p>
        </div>

        {/* Recommend toggle */}
        <div className="mb-5">
          <p className="text-sm font-medium mb-2">
            Would you recommend this builder?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!!saved}
              onClick={() => setRecommend(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                recommend === true
                  ? "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-700 text-green-700 dark:text-green-300"
                  : "border-border text-muted-foreground hover:border-green-300"
              } ${saved ? "cursor-default" : "cursor-pointer"}`}
            >
              Yes
            </button>
            <button
              type="button"
              disabled={!!saved}
              onClick={() => setRecommend(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                recommend === false
                  ? "bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-700 text-red-700 dark:text-red-300"
                  : "border-border text-muted-foreground hover:border-red-300"
              } ${saved ? "cursor-default" : "cursor-pointer"}`}
            >
              No
            </button>
          </div>
        </div>

        {/* Submit */}
        {!saved && (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Submit Review
          </button>
        )}
      </section>

      {/* ---- Community Ratings (Placeholder) ---- */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-3">Community Ratings</h2>
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-600 p-5 text-center space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Anonymous community ratings coming soon
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            When enough homeowners rate this builder, aggregate scores will
            appear here. All reviews are anonymous &mdash; builders cannot see
            who submitted ratings.
          </p>

          {/* Mock wireframe */}
          <div className="mt-4 space-y-3 max-w-sm mx-auto opacity-40 pointer-events-none select-none">
            <div className="flex items-center gap-3">
              <span className="text-xs w-28 text-left text-muted-foreground">
                Communication
              </span>
              <PlaceholderBar width="75%" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs w-28 text-left text-muted-foreground">
                Workmanship
              </span>
              <PlaceholderBar width="85%" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs w-28 text-left text-muted-foreground">
                Timeline
              </span>
              <PlaceholderBar width="60%" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs w-28 text-left text-muted-foreground">
                Cost
              </span>
              <PlaceholderBar width="70%" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs w-28 text-left text-muted-foreground">
                Resolution
              </span>
              <PlaceholderBar width="65%" />
            </div>
            <div className="mt-2 text-center">
              <span className="text-xs text-muted-foreground">
                -- reviews from -- homeowners
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Safety Note ---- */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-3">Privacy & Safety</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5 shrink-0">{FILLED_STAR}</span>
            Your review is stored locally on your device for now.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5 shrink-0">{FILLED_STAR}</span>
            In a future update, reviews will be anonymously aggregated.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5 shrink-0">{FILLED_STAR}</span>
            We will never share your identity with the builder.
          </li>
        </ul>
      </section>

      {/* ---- Rating Guidelines ---- */}
      <section className="bg-card border border-border rounded-xl p-6">
        <button
          type="button"
          onClick={() => setShowGuidelines((v) => !v)}
          className="flex items-center justify-between w-full text-left"
        >
          <h2 className="text-lg font-semibold">Rating Guidelines</h2>
          <span className="text-muted-foreground text-sm">
            {showGuidelines ? "Hide" : "Show"}
          </span>
        </button>

        {showGuidelines && (
          <div className="mt-4 space-y-2">
            {RATING_GUIDELINES.map((g) => (
              <div key={g.stars} className="flex items-center gap-3">
                <span className="text-yellow-400 text-sm w-20 shrink-0">
                  {FILLED_STAR.repeat(g.stars)}
                  {EMPTY_STAR.repeat(5 - g.stars)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {g.description}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
