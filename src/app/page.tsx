import { PlayGrabber } from "@/features/play-assets/ui/play-grabber";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-midnight-indigo sm:text-5xl">
          App Grabber
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-slate-blue">
          Download a Google Play app&apos;s icon, feature graphic and
          screenshots in the highest available resolution. Just type the app
          name.
        </p>
      </header>

      <PlayGrabber />

      <footer className="mt-20 text-center text-sm text-steel-gray">
        Assets belong to their respective developers. App Grabber only fetches
        the public Play Store listing.
      </footer>
    </main>
  );
}
