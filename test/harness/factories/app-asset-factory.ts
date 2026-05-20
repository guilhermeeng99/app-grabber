import type {
  AppAsset,
  AppAssetBundle,
  AppSummary,
} from "@/features/play-assets/domain/entities";

export function makeAppAsset(overrides: Partial<AppAsset> = {}): AppAsset {
  return {
    kind: "screenshot",
    name: "screenshot-01",
    fileName: "screenshot-01.png",
    url: "https://play-lh.googleusercontent.com/shot1=s0",
    ...overrides,
  };
}

export function makeAppSummary(overrides: Partial<AppSummary> = {}): AppSummary {
  return {
    appId: "com.example.app",
    title: "Example App",
    developer: "Example Dev",
    icon: "https://play-lh.googleusercontent.com/icon=s0",
    ...overrides,
  };
}

export function makeAppAssetBundle(
  overrides: Partial<AppAssetBundle> = {},
): AppAssetBundle {
  return {
    appId: "com.example.app",
    title: "Example App",
    developer: "Example Dev",
    assets: [makeAppAsset()],
    ...overrides,
  };
}
