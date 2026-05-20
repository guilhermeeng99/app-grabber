"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { AssetsRequestBody } from "@/features/play-assets/api/contracts";
import type { StoreId } from "@/features/play-assets/domain/entities";
import { COUNTRIES, LANGUAGES } from "@/features/play-assets/ui/locales";

type SearchMode = "name" | "id";

interface SearchFormProps {
  onSubmit: (request: AssetsRequestBody) => void;
  loading: boolean;
}

// Per-store hint for the "by id" field — Play takes a package name, the
// App Store takes a numeric track id or a bundle id.
const ID_PLACEHOLDER: Record<StoreId, string> = {
  play: "e.g. com.whatsapp",
  appstore: "e.g. 310633997 or net.whatsapp.WhatsApp",
};

const ID_LABEL: Record<StoreId, string> = {
  play: "Play package id",
  appstore: "App Store id",
};

export function SearchForm({ onSubmit, loading }: SearchFormProps) {
  // Default to id: Google Play's name search is rate-limited and flaky, so the
  // exact-id path is the reliable one to land on first.
  const [mode, setMode] = useState<SearchMode>("id");
  const [store, setStore] = useState<StoreId>("play");
  const [term, setTerm] = useState("");
  const [appId, setAppId] = useState("");
  const [country, setCountry] = useState("us");
  const [lang, setLang] = useState("en");

  const query = mode === "name" ? term : appId;
  const canSubmit = query.trim().length > 0 && !loading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    // A name search omits `store` so the server queries both stores; an id
    // search is store-bound (the id shape belongs to one store).
    onSubmit(
      mode === "name"
        ? { term: term.trim(), country, lang }
        : { store, appId: appId.trim(), country, lang },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-pale-gray bg-snow-white p-5 shadow-sm sm:p-7"
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-cloud-mist p-1">
          <ModeTab
            active={mode === "name"}
            onClick={() => setMode("name")}
            label="By name"
          />
          <ModeTab
            active={mode === "id"}
            onClick={() => setMode("id")}
            label="By id"
          />
        </div>

        {mode === "id" && (
          <div className="inline-flex rounded-full bg-cloud-mist p-1">
            <ModeTab
              active={store === "play"}
              onClick={() => setStore("play")}
              label="Google Play"
            />
            <ModeTab
              active={store === "appstore"}
              onClick={() => setStore("appstore")}
              label="App Store"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        {mode === "name" ? (
          <input
            type="text"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="e.g. WhatsApp"
            aria-label="App name"
            className={INPUT_CLASS}
          />
        ) : (
          <input
            type="text"
            value={appId}
            onChange={(event) => setAppId(event.target.value)}
            placeholder={ID_PLACEHOLDER[store]}
            aria-label={ID_LABEL[store]}
            className={`${INPUT_CLASS} font-mono`}
          />
        )}

        <LocaleSelect
          label="Country"
          value={country}
          options={COUNTRIES}
          onChange={setCountry}
        />
        <LocaleSelect
          label="Language"
          value={lang}
          options={LANGUAGES}
          onChange={setLang}
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-action-blue px-7 py-3 font-semibold text-snow-white shadow-sm transition hover:bg-action-blue-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Searching..." : "Grab"}
        </button>
      </div>

      {mode === "name" && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span aria-hidden className="mt-px font-bold">
            !
          </span>
          <span>
            Searches Google Play and the App Store at once. Note: Google Play
            name search is rate-limited on Google&apos;s side and can fail
            intermittently (the App Store stays reliable). For dependable
            results, search{" "}
            <button
              type="button"
              onClick={() => setMode("id")}
              className="font-semibold underline underline-offset-2 hover:text-amber-900"
            >
              by id
            </button>
            .
          </span>
        </p>
      )}
    </form>
  );
}

const INPUT_CLASS =
  "flex-1 rounded-lg border border-platinum-tint bg-snow-white px-4 py-3 text-midnight-indigo outline-none transition placeholder:text-steel-gray focus:border-action-blue focus:ring-2 focus:ring-action-blue/20";

function ModeTab(props: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        props.active
          ? "bg-action-blue text-snow-white shadow-sm"
          : "text-slate-blue hover:text-midnight-indigo"
      }`}
    >
      {props.label}
    </button>
  );
}

function LocaleSelect(props: {
  label: string;
  value: string;
  options: readonly { code: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={props.label}
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      className="app-select rounded-lg border border-platinum-tint bg-snow-white px-4 py-3 text-midnight-indigo outline-none transition focus:border-action-blue focus:ring-2 focus:ring-action-blue/20"
    >
      {props.options.map((option) => (
        <option key={option.code} value={option.code}>
          {props.label}: {option.label}
        </option>
      ))}
    </select>
  );
}
