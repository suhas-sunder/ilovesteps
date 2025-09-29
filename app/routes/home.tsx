import type { Route } from "./+types/home";
import { json } from "@remix-run/node";
import { useMemo, useState } from "react";

/* =========================================================
   META
========================================================= */
export function meta({}: Route.MetaArgs) {
  const title =
    "I Love Steps | Walking Calories Burned Calculator, Step-to-Mile Converter, and Walking Tips";
  const description =
    "Track walking calories burned by steps, pace, weight, and height. Convert steps to miles and kilometers. Learn how many calories walking burns, how to set step goals, and build a daily walking habit. Free, mobile-friendly, no sign-up.";
  const url = "https://ilovesteps.com/";
  return [
    { title },
    { name: "description", content: description },
    {
      name: "keywords",
      content: [
        "walking calories calculator",
        "steps to calories",
        "steps to miles",
        "calories burned walking",
        "brisk walking calories",
        "10000 steps calories",
        "walking tips for beginners",
        "walking for weight loss",
        "non-equipment exercise",
      ].join(", "),
    },
    { name: "robots", content: "index,follow,max-image-preview:large" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: `${url}og-image.jpg` },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { rel: "canonical", href: url },
    { name: "theme-color", content: "#d1fae5" }, // emerald green
  ];
}

/* =========================================================
   LOADER
========================================================= */
export function loader() {
  return json({ nowISO: new Date().toISOString() });
}

/* =========================================================
   UTILS + UI
========================================================= */
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}
function toNumber(v: string) {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const Field = ({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) => (
  <label className="block">
    <div className="text-sm font-medium text-emerald-900">{label}</div>
    <div className="mt-1">{children}</div>
    {hint ? <div className="mt-1 text-xs text-emerald-600">{hint}</div> : null}
  </label>
);

const NumberInput = ({
  value,
  onChange,
  min,
  step = 1,
}: {
  value: number | string;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) => (
  <input
    type="number"
    value={value}
    min={min}
    step={step}
    onChange={(e) => onChange(toNumber(e.target.value))}
    className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
  />
);

/* =========================================================
   CALCULATOR
========================================================= */
type SexKey = "female" | "male";
type PaceKey = "easy" | "brisk" | "power" | "jog";

const STRIDE_FACTORS: Record<SexKey, number> = { female: 0.413, male: 0.415 };
const PACE: Record<PaceKey, { mph: number; mets: number; label: string }> = {
  easy: { mph: 2.5, mets: 3.0, label: "Easy Walk (~2.5 mph / 4 kph)" },
  brisk: { mph: 3.5, mets: 4.3, label: "Brisk Walk (~3.5 mph / 5.6 kph)" },
  power: { mph: 4.3, mets: 5.0, label: "Power Walk (~4.3 mph / 6.9 kph)" },
  jog: { mph: 5.0, mets: 7.0, label: "Light Jog (~5 mph / 8 kph)" },
};

function useWalkingCalc({
  weight,
  weightUnit,
  height,
  heightUnit,
  steps,
  sex,
  pace,
  customStrideCm,
  useCustomStride,
}: {
  weight: number;
  weightUnit: "kg" | "lb";
  height: number;
  heightUnit: "cm" | "in";
  steps: number;
  sex: SexKey;
  pace: PaceKey;
  customStrideCm: number;
  useCustomStride: boolean;
}) {
  return useMemo(() => {
    const weightKg = weightUnit === "kg" ? weight : weight * 0.45359237;
    const heightCm = heightUnit === "cm" ? height : height * 2.54;
    const strideAuto = heightCm * STRIDE_FACTORS[sex]; // default male if sex=male
    const strideCm = useCustomStride
      ? customStrideCm || strideAuto
      : strideAuto;
    const distanceKm = ((steps || 0) * (strideCm / 100)) / 1000;
    const distanceMi = distanceKm * 0.621371;
    const { mph, mets } = PACE[pace];
    const hours = mph > 0 ? distanceMi / mph : 0;
    const minutes = hours * 60;
    const calories = mets * 3.5 * weightKg * (minutes / 200);
    const cadence = minutes > 0 ? steps / minutes : 0;
    return {
      strideAuto,
      strideCm,
      distanceKm,
      distanceMi,
      minutes,
      hours,
      calories,
      cadence,
      mph,
    };
  }, [
    weight,
    weightUnit,
    height,
    heightUnit,
    steps,
    sex,
    pace,
    customStrideCm,
    useCustomStride,
  ]);
}

function CaloriesCalculator() {
  const [inputMode, setInputMode] = useState<"steps" | "distance" | "time">(
    "steps"
  );
  const [weight, setWeight] = useState(70);
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");
  const [height, setHeight] = useState(170);
  const [heightUnit, setHeightUnit] = useState<"cm" | "in">("cm");
  const [steps, setSteps] = useState(5000);
  const [distanceKm, setDistanceKm] = useState(4);
  const [timeMin, setTimeMin] = useState(40);
  const [pace, setPace] = useState<PaceKey>("brisk");
  const [sex, setSex] = useState<SexKey>("male");
  const [useCustomStride, setUseCustomStride] = useState(false);
  const [customStrideCm, setCustomStrideCm] = useState(0);

  // derive steps if user enters distance or time
  const calcSteps = useMemo(() => {
    if (inputMode === "steps") return steps;
    const km =
      inputMode === "distance"
        ? distanceKm
        : PACE[pace].mph * 1.60934 * (timeMin / 60); // from pace & time
    const strideCm = useCustomStride
      ? customStrideCm || height * STRIDE_FACTORS[sex]
      : height * STRIDE_FACTORS[sex];
    return Math.round((km * 1000) / (strideCm / 100));
  }, [
    inputMode,
    steps,
    distanceKm,
    timeMin,
    pace,
    height,
    sex,
    useCustomStride,
    customStrideCm,
  ]);

  const r = useWalkingCalc({
    weight,
    weightUnit,
    height,
    heightUnit,
    steps: calcSteps,
    sex,
    pace,
    customStrideCm,
    useCustomStride,
  });

  const resetAll = () => {
    setWeight(70);
    setSteps(5000);
    setDistanceKm(4);
    setTimeMin(40);
    setInputMode("steps");
    setUseCustomStride(false);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* ---------- Input Panel ---------- */}
      <Card>
        <h3 className="text-xl font-semibold text-emerald-900">
          Walking & Jogging Calories-Burned Calculator
        </h3>
        <p className="mt-1 text-sm text-emerald-700">
          Enter what you know - steps, distance, or time - plus your body
          metrics to estimate calories burned.
        </p>

        {/* input type toggle */}
        <div className="mt-4 flex rounded-lg overflow-hidden border border-emerald-300">
          {["steps", "distance", "time"].map((m) => (
            <button
              key={m}
              onClick={() => setInputMode(m as any)}
              className={`flex-1 px-3 py-2 text-sm capitalize ${
                inputMode === m
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-emerald-700"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          <Field label="Weight">
            <div className="flex gap-2">
              <NumberInput value={weight} onChange={setWeight} />
              <select
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value as any)}
                className="rounded border border-emerald-300 px-2"
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </Field>

          <Field label="Height (for stride)">
            <div className="flex gap-2">
              <NumberInput value={height} onChange={setHeight} />
              <select
                value={heightUnit}
                onChange={(e) => setHeightUnit(e.target.value as any)}
                className="rounded border border-emerald-300 px-2"
              >
                <option value="cm">cm</option>
                <option value="in">in</option>
              </select>
            </div>
          </Field>

          {inputMode === "steps" && (
            <Field label="Steps">
              <NumberInput value={steps} onChange={setSteps} step={100} />
            </Field>
          )}
          {inputMode === "distance" && (
            <Field label="Distance (km)">
              <NumberInput
                value={distanceKm}
                onChange={setDistanceKm}
                step={0.1}
              />
            </Field>
          )}
          {inputMode === "time" && (
            <Field label="Time (minutes)">
              <NumberInput value={timeMin} onChange={setTimeMin} step={1} />
            </Field>
          )}

          <Field label="Pace">
            <select
              value={pace}
              onChange={(e) => setPace(e.target.value as PaceKey)}
              className="w-full rounded border border-emerald-300 px-2 py-2"
            >
              {Object.entries(PACE).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Sex (for stride)">
            <div className="flex gap-2">
              <button
                onClick={() => setSex("male")}
                className={`flex-1 rounded-lg border px-3 py-2 ${
                  sex === "male"
                    ? "bg-emerald-600 text-white"
                    : "border-emerald-300"
                }`}
              >
                Male
              </button>
              <button
                onClick={() => setSex("female")}
                className={`flex-1 rounded-lg border px-3 py-2 ${
                  sex === "female"
                    ? "bg-emerald-600 text-white"
                    : "border-emerald-300"
                }`}
              >
                Female
              </button>
            </div>
          </Field>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useCustomStride}
              onChange={(e) => setUseCustomStride(e.target.checked)}
            />
            Use custom stride
          </label>
          {useCustomStride && (
            <Field label="Stride length (cm)">
              <NumberInput
                value={customStrideCm}
                onChange={setCustomStrideCm}
              />
              <p className="text-xs text-emerald-600">
                Default auto-stride ≈ {r.strideAuto.toFixed(0)} cm
              </p>
            </Field>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={resetAll}
              className="rounded-lg border border-emerald-300 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
            >
              Reset
            </button>
          </div>
        </div>
      </Card>

      {/* ---------- Results Panel ---------- */}
      <Card className="flex flex-col justify-between">
        <div>
          <h4 className="text-lg font-semibold text-emerald-900 mb-4">
            Results
          </h4>
          <p className="text-5xl font-bold text-emerald-700">
            {Math.max(0, r.calories).toFixed(0)}{" "}
            <span className="text-xl font-medium">calories</span>
          </p>
          <ul className="mt-4 space-y-2 text-emerald-800">
            <li>
              Distance: {r.distanceMi.toFixed(2)} mi / {r.distanceKm.toFixed(2)}{" "}
              km
            </li>
            <li>Duration: {Math.round(r.minutes)} min</li>
            <li>Pace speed: {r.mph.toFixed(1)} mph</li>
            <li>Cadence: {r.cadence.toFixed(0)} steps/min</li>
            <li>Stride used: {r.strideCm.toFixed(0)} cm</li>
          </ul>
        </div>

        <div className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          <h5 className="font-semibold text-emerald-900">Quick Reference</h5>
          <ul className="list-disc list-inside mt-2">
            <li>~2 000 steps ≈ 1 mile</li>
            <li>Brisk walk ≈ 100 – 120 steps / min</li>
            <li>Consistency beats intensity</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */
export default function Home({ loaderData: { nowISO } }: Route.ComponentProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "I Love Steps",
        url: "https://ilovesteps.com/",
        description:
          "Walking tools: calories-burned calculator, step-to-mile converter, and guides for building a healthy walking habit.",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How accurate is the walking calories calculator?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "It uses standard MET equations with pace-based MET values and your weight to estimate energy expenditure.",
            },
          },
          {
            "@type": "Question",
            name: "How do you convert steps to miles?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Distance equals steps × stride length; we estimate stride from height (~0.414 × height) unless you enter custom.",
            },
          },
          {
            "@type": "Question",
            name: "Is 10,000 steps required?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No, many people benefit at 6–8k steps/day; start lower and increase gradually.",
            },
          },
        ],
      },
    ],
  };

  return (
    <main className="bg-emerald-50/20 text-emerald-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* TOP BAR */}
      <div className="w-full border-b border-emerald-100 bg-emerald-50/20/60">
        <div className="mx-auto max-w-7xl px-4 py-2 text-sm text-emerald-700">
          Free walking tools • Last updated{" "}
          {new Date(nowISO).toLocaleDateString()}
        </div>
      </div>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-5">
            <h1 className="text-4xl font-extrabold tracking-tight">
              Track Your Steps. Burn Calories. Feel Better.
            </h1>
            <p className="text-lg text-emerald-800">
              Use the free calculator to estimate{" "}
              <strong>calories burned</strong> from your steps, pace, and
              weight. Convert <strong>steps to miles</strong> automatically.
              Explore practical walking tips to build a habit you’ll keep.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#calculator"
                className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-emerald-800 shadow-sm hover:bg-emerald-100"
              >
                Calculate Calories Burned
              </a>
              <a
                href="#benefits"
                className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-emerald-800 shadow-sm hover:bg-emerald-100"
              >
                See Walking Benefits
              </a>
            </div>
          </div>
          <Card>
            <h2 className="text-base font-semibold text-emerald-900">
              At a Glance
            </h2>
            <ul className="mt-3 grid gap-2 text-sm text-emerald-800 sm:grid-cols-2">
              <li>• Calories burned by steps & pace</li>
              <li>• Steps ⇆ miles ⇆ kilometers</li>
              <li>• Auto stride from height</li>
              <li>• Brisk vs. easy walk comparisons</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* CALCULATOR */}
      <section
        id="calculator"
        className="mx-auto max-w-7xl px-4 py-12 scroll-mt-16"
      >
        <h2 className="text-2xl font-bold text-emerald-900">
          Walking / Jogging Calories Burned
        </h2>
        <div className="mt-6">
          <CaloriesCalculator />
        </div>
      </section>

      {/* SEO-RICH CONTENT */}
      <section id="benefits" className="mx-auto max-w-7xl px-4 py-16">
        <Card>
          <h2 className="text-2xl font-bold text-emerald-900">
            Benefits of Walking
          </h2>
          <p className="mt-3 text-emerald-800 leading-relaxed">
            Walking is simple yet powerful: supports heart health, improves
            blood sugar, strengthens joints and muscles, boosts mood and sleep,
            and helps with weight control-no equipment needed.
          </p>
          <p className="mt-3 text-emerald-800 leading-relaxed">
            Consistency beats intensity: a 20–30 min walk most days can burn
            thousands of calories over a year with minimal injury risk.
          </p>
          <ul className="mt-4 list-disc list-inside text-emerald-900">
            <li>Supports heart & lung function</li>
            <li>Improves insulin sensitivity</li>
            <li>Enhances balance & flexibility</li>
            <li>Reduces stress and anxiety</li>
          </ul>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 space-y-6 leading-relaxed text-emerald-800">
        <h2 className="text-2xl font-bold text-emerald-900">
          Walking Guides, Tips & Step-Goal Strategies
        </h2>
        <p>
          Whether you are just starting a <strong>daily walking routine</strong>{" "}
          or trying to hit a new <strong>step-count milestone</strong>, the
          right approach makes walking safer, more enjoyable, and more effective
          for burning calories. Below are some of the most-searched walking
          topics designed to help you improve{" "}
          <em>consistency, endurance, and weight-loss outcomes</em>.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-xl border border-emerald-200 bg-white/70 p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-emerald-900">
              Starting a Walking Habit
            </h3>
            <p className="text-sm">
              Begin with <strong>10–15 minute daily walks</strong> at an easy
              pace. Gradually add 500–1,000 steps per week until you reach your
              comfort zone. Consistency matters more than speed for long-term
              calorie burn and heart-health benefits.
            </p>
          </article>

          <article className="rounded-xl border border-emerald-200 bg-white/70 p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-emerald-900">
              Choosing the Right Shoes
            </h3>
            <p className="text-sm">
              Invest in <strong>lightweight walking shoes</strong> with good
              arch support and cushioning to reduce knee and ankle strain.
              Replace shoes every 500 miles or when tread wears out to keep your
              stride efficient.
            </p>
          </article>

          <article className="rounded-xl border border-emerald-200 bg-white/70 p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-emerald-900">
              The 10,000-Step Myth
            </h3>
            <p className="text-sm">
              Research shows <strong>7,000–9,000 steps/day</strong> already
              delivers major cardiovascular and weight-management benefits.
              Focus on
              <em> steady progress </em> over round numbers-your ideal goal
              depends on age, lifestyle, and fitness level.
            </p>
          </article>

          <article className="rounded-xl border border-emerald-200 bg-white/70 p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-emerald-900">
              Walking for Weight Loss
            </h3>
            <p className="text-sm">
              A <strong>30-minute brisk walk</strong> (3–3.5 mph) can burn
              120-160 kcal for most adults. Pair daily walks with a modest
              calorie deficit to achieve sustainable weight loss without intense
              workouts.
            </p>
          </article>

          <article className="rounded-xl border border-emerald-200 bg-white/70 p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-emerald-900">
              Weather-Smart Walking
            </h3>
            <p className="text-sm">
              Dress in breathable layers for cold days and moisture-wicking
              fabrics in heat. Hydrate well, wear reflective gear at dusk or
              dawn, and avoid icy or uneven paths to reduce fall risk.
            </p>
          </article>

          <article className="rounded-xl border border-emerald-200 bg-white/70 p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-emerald-900">
              Boosting Motivation
            </h3>
            <p className="text-sm">
              Use a <strong>pedometer or step-tracking app</strong> to set
              weekly targets. Walk with friends, listen to upbeat music or
              podcasts, and reward streak milestones to keep the habit
              enjoyable.
            </p>
          </article>
        </div>

        <p>
          Walking is one of the most accessible{" "}
          <strong>low-impact cardio exercises</strong>, ideal for beginners,
          seniors, and anyone returning after injury. Start slow, aim for
          gradual increases, and track your <em>calories burned</em> to stay
          encouraged on your fitness journey.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 space-y-6 leading-relaxed text-emerald-800">
        <h2 className="text-2xl font-bold text-emerald-900">
          Calories Burned by Steps, Distance & Pace
        </h2>
        <p>
          A typical adult weighing 150&nbsp;lb (68&nbsp;kg) burns roughly
          <strong> 30–40 calories per 1,000 steps</strong> at an easy pace, and
          <strong> 45–55 calories</strong> if walking briskly. The exact number
          varies by body weight, terrain, and speed.
        </p>
        <p>
          Use our free <strong>walking calories calculator</strong> to adjust
          for your weight and pace. The faster you walk or the steeper the hill,
          the higher the calorie burn per step.
        </p>
        <div className="overflow-x-auto rounded-xl border border-emerald-200 bg-white shadow-sm">
          <table className="w-full text-sm text-emerald-800">
            <thead className="bg-emerald-100 text-emerald-900">
              <tr>
                <th className="p-2 text-left">Steps</th>
                <th className="p-2 text-left">Easy Walk (2&nbsp;mph)</th>
                <th className="p-2 text-left">Brisk Walk (3.5&nbsp;mph)</th>
                <th className="p-2 text-left">Jog (5&nbsp;mph)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2">2,000</td>
                <td className="p-2">60–70&nbsp;cal</td>
                <td className="p-2">80–90&nbsp;cal</td>
                <td className="p-2">120–130&nbsp;cal</td>
              </tr>
              <tr>
                <td className="p-2">5,000</td>
                <td className="p-2">150–180&nbsp;cal</td>
                <td className="p-2">200–220&nbsp;cal</td>
                <td className="p-2">300–320&nbsp;cal</td>
              </tr>
              <tr>
                <td className="p-2">10,000</td>
                <td className="p-2">300–360&nbsp;cal</td>
                <td className="p-2">400–450&nbsp;cal</td>
                <td className="p-2">600–650&nbsp;cal</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          These estimates assume level ground. Adding hills or carrying a
          backpack can raise calorie expenditure by 10–20%.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 space-y-6 leading-relaxed text-emerald-800">
        <h2 className="text-2xl font-bold text-emerald-900">
          Walking Safety, Posture & Injury-Prevention
        </h2>
        <p>
          Proper <strong>posture and footwear</strong> keep walking a
          <strong> low-impact cardio exercise</strong> that protects your joints
          and spine. Follow these expert-approved tips:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>
            Warm up with 3–5 minutes of gentle ankle rolls and leg swings.
          </li>
          <li>
            Keep your head up, shoulders relaxed, and arms swinging naturally.
          </li>
          <li>
            Land on your mid-foot, not your toes or heels, for smoother strides.
          </li>
          <li>
            Wear moisture-wicking socks to prevent blisters on long walks.
          </li>
          <li>
            Use reflective clothing or lights if walking near traffic at night.
          </li>
          <li>
            Increase mileage by no more than 10 % per week to avoid shin
            splints.
          </li>
          <li>
            Stretch calves, hamstrings, and hips after each walk to maintain
            flexibility.
          </li>
        </ul>
        <p>
          Practicing safe technique reduces common overuse injuries such as
          plantar fasciitis, knee pain, or lower-back strain, letting you keep
          up your step-count goals consistently.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 space-y-6 leading-relaxed text-emerald-800">
        <h2 className="text-2xl font-bold text-emerald-900">
          Indoor Step Workouts & No-Equipment Cardio
        </h2>
        <p>
          Bad weather or busy schedules shouldn’t stop your daily step goal.
          Here are <strong>indoor walking & low-equipment cardio ideas</strong>{" "}
          to keep you active:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>March in place during TV breaks or phone calls.</li>
          <li>
            Walk laps around your home or climb stairs for extra calorie burn.
          </li>
          <li>
            Try <strong>interval walks</strong> - 1 minute brisk pace, 1 minute
            easy pace.
          </li>
          <li>
            Combine steps with light body-weight moves such as squats or arm
            raises.
          </li>
          <li>
            Put on music and do a 15-minute indoor dance-walk session for fun
            cardio.
          </li>
          <li>
            Use a sturdy chair for step-ups to add intensity without a
            treadmill.
          </li>
        </ul>
        <p>
          Consistent <strong>indoor walking routines</strong> can add thousands
          of steps each week, improving heart health and stamina even when
          outdoor walks aren’t possible.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 space-y-5 leading-relaxed text-emerald-800">
        <h2 className="text-2xl font-bold text-emerald-900">
          How Many Calories Does Walking Burn?
        </h2>
        <p>
          The calories you burn while walking depend on your body weight,
          walking pace, terrain, distance, and total steps. In general, a brisk
          3.5 mph (5.6 kph) walk burns about{" "}
          <strong>250–350 calories per hour</strong> for someone weighing 70 kg.
          A faster power-walk or light jog can raise that to 400 + calories per
          hour.
        </p>
        <p>
          Our calculator above uses standard <strong>METS</strong> (metabolic
          equivalents) to estimate calories for different paces and
          automatically adjusts for height-based stride length. This means the
          distance and calories shown will be more accurate than simple “2 000
          steps = 1 mile” rules of thumb.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 space-y-5 leading-relaxed text-emerald-800">
        <h2 className="text-2xl font-bold text-emerald-900">
          Steps-to-Miles & Distance Guide
        </h2>
        <p>
          Converting steps to distance helps you set practical daily goals. For
          most adults,
          <strong>2 000 steps ≈ 1 mile</strong> (≈ 1.6 km), but stride length
          varies with height and walking style. Taller walkers usually cover
          more ground per step.
        </p>
        <p>
          I Love Steps estimates your stride automatically from your height and
          sex so the miles or kilometers shown match your real-world walking
          pattern. You can also enable a custom stride length for extra
          precision if you know your exact gait.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 space-y-5 leading-relaxed text-emerald-800">
        <h2 className="text-2xl font-bold text-emerald-900">
          Walking for Weight-Loss & Health
        </h2>
        <p>
          Consistent walking is one of the easiest ways to manage weight, lower
          stress, and improve cardiovascular fitness without equipment. Studies
          show that adding
          <strong>30 minutes of brisk walking most days</strong> can help
          maintain a healthy body-mass index (BMI) and support gradual fat loss
          when paired with balanced nutrition.
        </p>
        <p>
          Whether your goal is <strong>10 000 steps per day</strong> or simply
          adding a 15-minute stroll after meals, small habits compound into
          measurable health gains. Our free calculator lets you see exactly how
          many calories each walk contributes toward your weekly activity
          target.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 space-y-5 leading-relaxed text-emerald-800">
        <h2 className="text-2xl font-bold text-emerald-900">
          Walking vs. Jogging: Which Burns More Calories?
        </h2>
        <p>
          Jogging usually burns more calories per minute because it requires
          higher energy output - about <strong>7 METS</strong> compared with{" "}
          <strong>3–5 METS</strong>
          for walking. However, brisk walking is gentler on joints and easier to
          sustain for longer sessions, so total calories burned over time can be
          similar.
        </p>
        <p>
          Our tool lets you compare both activities: enter the same distance or
          time and switch the pace from “Brisk Walk” to “Light Jog” to see the
          difference in calorie expenditure.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 space-y-5 leading-relaxed text-emerald-800">
        <h2 className="text-2xl font-bold text-emerald-900">
          Beginner Tips to Build a Daily Walking Habit
        </h2>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Start small:</strong> aim for 10–15 minutes a day and add 5
            minutes weekly.
          </li>
          <li>
            <strong>Pick the right shoes:</strong> cushioned sneakers reduce
            joint stress.
          </li>
          <li>
            <strong>Track your progress:</strong> use our calculator or a simple
            step-counter app.
          </li>
          <li>
            <strong>Mix up routes:</strong> new scenery keeps walks interesting
            and motivating.
          </li>
          <li>
            <strong>Stay consistent:</strong> daily movement matters more than
            occasional long sessions.
          </li>
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 space-y-5 leading-relaxed text-emerald-800">
        <h2 className="text-2xl font-bold text-emerald-900">
          Safety & Form Checklist for Everyday Walkers
        </h2>
        <p>
          Good posture and a safe environment help you get the most from your
          steps:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>Keep head up, shoulders relaxed, and arms swinging naturally.</li>
          <li>
            Use well-lit sidewalks or trails; wear reflective gear at night.
          </li>
          <li>
            Warm up 3–5 minutes before brisk walking; stretch calves and
            hamstrings after.
          </li>
          <li>
            Stay hydrated on longer walks and avoid uneven terrain if you have
            ankle or knee issues.
          </li>
        </ul>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold text-emerald-900">
          Frequently Asked Questions
        </h2>
        <dl className="mt-6 space-y-6">
          <div>
            <dt className="font-semibold">
              How accurate is the walking calories calculator?
            </dt>
            <dd className="mt-1 text-emerald-800">
              It uses MET formulas and stride estimates; good for planning but
              not a medical device.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">How do I convert steps to miles?</dt>
            <dd className="mt-1 text-emerald-800">
              Distance = steps × stride length; we auto-estimate from height or
              use your custom stride.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">
              Is walking enough for weight loss?
            </dt>
            <dd className="mt-1 text-emerald-800">
              Walking plus a balanced diet often leads to gradual weight loss,
              especially at 7–9k+ steps/day.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Is the calculator free?</dt>
            <dd className="mt-1 text-emerald-800">
              Yes, all tools on I Love Steps are 100% free to use.
            </dd>
          </div>
        </dl>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-emerald-200 bg-emerald-50/20 py-6 text-center text-sm text-emerald-700">
        © {new Date().getFullYear()} I Love Steps • Free walking & jogging
        tools
      </footer>
    </main>
  );
}
