import { ValidationError } from "@/core/errors";
import { err, ok } from "@/core/result";
import type { Result } from "@/core/result";
import type {
  MultiGrabRequest,
  MultiGrabResult,
  StoreGrabOutcome,
  StoreId,
} from "@/features/play-assets/domain/entities";
import type { GrabAppAssetsUseCase } from "@/features/play-assets/domain/usecases/grab-app-assets";

const ALL_STORES: readonly StoreId[] = ["play", "appstore"];

/**
 * Resolve an app across stores: a name search fans out to every store (one
 * outcome each, with independent failures), while an id search targets the
 * single store the id belongs to. Orchestration only — each store's
 * resolution is delegated to its own `GrabAppAssetsUseCase`. Once the input is
 * valid this never fails as a whole; per-store failures are captured as
 * outcomes so the UI can show successes and errors side by side.
 */
export class GrabFromStoresUseCase {
  constructor(
    private readonly grabbers: Record<StoreId, GrabAppAssetsUseCase>,
  ) {}

  async call(request: MultiGrabRequest): Promise<Result<MultiGrabResult>> {
    const appId = request.appId?.trim();
    const term = request.term?.trim();
    if (!appId && !term) {
      return err(new ValidationError("Provide an app name or a store id."));
    }

    const locale = { country: request.country, lang: request.lang };
    const grabRequest = appId ? { appId, ...locale } : { term, ...locale };
    const stores = appId ? [request.store ?? "play"] : ALL_STORES;

    const outcomes = await Promise.all(
      stores.map(
        async (store): Promise<StoreGrabOutcome> => ({
          store,
          result: await this.grabbers[store].call(grabRequest),
        }),
      ),
    );
    return ok({ outcomes });
  }
}
