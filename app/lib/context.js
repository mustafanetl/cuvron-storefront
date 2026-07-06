import {createHydrogenContext, InMemoryCache} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';

// Define the additional context object
const additionalContext = {
  // Additional context for custom properties, CMS clients, 3P SDKs, etc.
  // These will be available as both context.propertyName and context.get(propertyContext)
  // Example of complex objects that could be added:
  // cms: await createCMSClient(env),
  // reviews: await createReviewsClient(env),
};

let fallbackCache;
let hasWarnedMockStorefrontEnv = false;

function withStorefrontEnvDefaults(env) {
  const storeDomain = env?.PUBLIC_STORE_DOMAIN || 'mock.shop';
  const storefrontToken =
    env?.PUBLIC_STOREFRONT_API_TOKEN || 'abcdefghijklmnopqrstuvwxyz123456';
  const checkoutDomain = env?.PUBLIC_CHECKOUT_DOMAIN || storeDomain;

  if (
    (!env?.PUBLIC_STORE_DOMAIN ||
      !env?.PUBLIC_STOREFRONT_API_TOKEN ||
      !env?.PUBLIC_CHECKOUT_DOMAIN) &&
    !hasWarnedMockStorefrontEnv
  ) {
    hasWarnedMockStorefrontEnv = true;
    console.warn(
      '[CUVRON] Using fallback mock Shopify env values. Set PUBLIC_STORE_DOMAIN, PUBLIC_STOREFRONT_API_TOKEN, and PUBLIC_CHECKOUT_DOMAIN for real-store checkout.',
    );
  }

  return {
    ...env,
    PUBLIC_STORE_DOMAIN: storeDomain,
    PUBLIC_STOREFRONT_API_TOKEN: storefrontToken,
    PUBLIC_CHECKOUT_DOMAIN: checkoutDomain,
  };
}

/**
 * Use the platform cache in worker runtimes, otherwise fall back to
 * a process-level in-memory cache for Node runtimes (e.g. Vercel Functions).
 */
function getRuntimeCache() {
  if (globalThis.caches?.open) {
    return globalThis.caches.open('hydrogen');
  }

  if (!fallbackCache) {
    fallbackCache = new InMemoryCache();
  }

  return Promise.resolve(fallbackCache);
}

/**
 * Creates Hydrogen context for React Router 7.9.x
 * Returns HydrogenRouterContextProvider with hybrid access patterns
 * @param {Request} request
 * @param {Env} env
 * @param {ExecutionContext} executionContext
 */
export async function createHydrogenRouterContext(
  request,
  env,
  executionContext,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const runtimeEnv = withStorefrontEnvDefaults(env);

  const waitUntil =
    executionContext?.waitUntil?.bind(executionContext) ??
    ((promise) => {
      void promise;
    });
  const [cache, session] = await Promise.all([
    getRuntimeCache(),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const hydrogenContext = createHydrogenContext(
    {
      env: runtimeEnv,
      request,
      cache,
      waitUntil,
      session,
      // Or detect from URL path based on locale subpath, cookies, or any other strategy
      i18n: {language: 'EN', country: 'US'},
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
      },
    },
    additionalContext,
  );

  return hydrogenContext;
}

/** @typedef {Class<additionalContext>} AdditionalContextType */
