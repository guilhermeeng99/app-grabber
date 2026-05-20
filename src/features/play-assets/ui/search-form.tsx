"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { AssetsRequestBody } from "@/features/play-assets/api/contracts";
import { COUNTRIES, LANGUAGES } from "@/features/play-assets/ui/locales";

type SearchMode = "name" | "id";

interface SearchFormProps {
  onSubmit: (request: AssetsRequestBody) => void;
  loading: boolean;
}

export function SearchForm({ onSubmit, loading }: SearchFormProps) {
  const [mode, setMode] = useState<SearchMode>("name");
  const [term, setTerm] = useState("");
  const [appId, setAppId] = useState("");
  const [country, setCountry] = useState("us");
  const [lang, setLang] = useState("en");

  const query = mode === "name" ? term : appId;
  const canSubmit = query.trim().length > 0 && !loading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit(
      mode === "name"
        ? { term: term.trim(), country, lang }
        : { appId: appId.trim(), country, lang },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-pale-gray bg-snow-white p-5 shadow-sm sm:p-7"
    >
      <div className="mb-5 inline-flex rounded-full bg-cloud-mist p-1">
        <ModeTab
          active={mode === "name"}
          onClick={() => setMode("name")}
          label="By name"
        />
        <ModeTab
          active={mode === "id"}
          onClick={() => setMode("id")}
          label="By package id"
        />
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
            placeholder="e.g. com.whatsapp"
            aria-label="Package id"
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
