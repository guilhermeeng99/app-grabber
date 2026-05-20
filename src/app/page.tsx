import { PlayGrabber } from "@/features/play-assets/ui/play-grabber";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-midnight-indigo sm:text-5xl">
          App Grabber
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-slate-blue">
          Search Google Play and the App Store at once. Download icons, banners
          and screenshots (phone and tablet) at the highest available
          resolution, neatly grouped by section.
        </p>
      </header>

      <PlayGrabber />

      <footer className="mt-20 text-center text-sm text-steel-gray">
        <p>
          Assets belong to their respective developers. App Grabber only fetches
          public Google Play and App Store listings.
        </p>
        <p className="mt-2">
          Built by Guilherme Passos ·{" "}
          <a
            href="https://github.com/guilhermeeng99"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-slate-blue transition hover:text-action-blue"
          >
            GitHub
          </a>{" "}
          ·{" "}
          <a
            href="https://www.linkedin.com/in/guigapassos/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-slate-blue transition hover:text-action-blue"
          >
            LinkedIn
          </a>
        </p>
      </footer>
    </main>
  );
}
