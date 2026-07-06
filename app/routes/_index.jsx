import {Await, Link, useLoaderData} from 'react-router';
import {Suspense} from 'react';
import {Money} from '@shopify/hydrogen';
import {MockShopNotice} from '~/components/MockShopNotice';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: 'CUVRON | Premium Comfywear'}];
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollection: collections.nodes[0],
  };
}

function loadDeferredData({context}) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();

  return (
    <div className="cuvron-home">
      {data.isShopLinked ? null : <MockShopNotice />}

      <section className="cuvron-hero">
        <img
          src="/brand/02c-homepage-hero-cv-v-up.png"
          alt="CUVRON hero"
        />
      </section>

      <section className="cuvron-category-tiles">
        <Link to="/collections/all" className="cuvron-tile">
          <span>Hoodies</span>
          <small>Heavyweight comfort, premium finish</small>
        </Link>
        <Link to="/collections/all" className="cuvron-tile">
          <span>T-Shirts</span>
          <small>Soft everyday essentials with clean fits</small>
        </Link>
        <Link to="/collections/all" className="cuvron-tile">
          <span>Pajamas</span>
          <small>Elevated sleepwear made to be seen</small>
        </Link>
      </section>

      <section className="cuvron-home-split">
        <div>
          <p className="cuvron-kicker">Campaign</p>
          <h2>Designed for slow mornings and late nights.</h2>
          <p>
            CUVRON blends relaxed silhouettes with luxury-level execution. Our
            core pieces are built for repeat wear and high comfort.
          </p>
          <Link to="/collections/all" className="cuvron-button-dark">
            Shop the Collection
          </Link>
        </div>
        <img
          src="/brand/09c-couple-campaign-cv-v-up.png"
          alt="CUVRON couple campaign"
        />
      </section>

      <section className="cuvron-product-lineup-showcase">
        <img
          src="/brand/04c-product-lineup-cv-v-up.png"
          alt="CUVRON core product lineup"
        />
      </section>

      <section className="cuvron-recommended">
        <div className="cuvron-section-head">
          <p className="cuvron-kicker">Best Sellers</p>
          <h2>Shop customer favorites</h2>
        </div>

        <Suspense fallback={<div>Loading products...</div>}>
          <Await resolve={data.recommendedProducts}>
            {(response) => (
              <div className="cuvron-product-grid">
                {response
                  ? response.products.nodes.map((product) => (
                      <Link
                        className="cuvron-product-card"
                        key={product.id}
                        prefetch="intent"
                        to={`/products/${product.handle}`}
                      >
                        {product.featuredImage ? (
                          <img
                            src={product.featuredImage.url}
                            alt={product.featuredImage.altText || product.title}
                            loading="lazy"
                          />
                        ) : null}
                        <h3>{product.title}</h3>
                        <span>
                          <Money data={product.priceRange.minVariantPrice} />
                        </span>
                      </Link>
                    ))
                  : null}
              </div>
            )}
          </Await>
        </Suspense>
      </section>

      <section className="cuvron-lifestyle-grid">
        <img src="/brand/12-lookbook-male-campaign.png" alt="Male campaign" />
        <img
          src="/brand/13-lookbook-female-campaign.png"
          alt="Female campaign"
        />
        <img src="/brand/16-night-street-outer-look.png" alt="Night campaign" />
      </section>

      <section className="cuvron-trust-bar">
        <div>
          <h4>Premium quality</h4>
          <p>Fabric-first construction and tested comfort.</p>
        </div>
        <div>
          <h4>Fast EU shipping</h4>
          <p>Reliable delivery and easy returns.</p>
        </div>
        <div>
          <h4>Secure checkout</h4>
          <p>Built for smooth conversion and payment trust.</p>
        </div>
      </section>

      <section className="cuvron-packaging-block">
        <img src="/brand/18-packaging-unboxing.png" alt="CUVRON packaging" />
      </section>

      {data.featuredCollection ? (
        <section className="cuvron-collection-cta">
          <div>
            <p className="cuvron-kicker">Collection Spotlight</p>
            <h2>{data.featuredCollection.title}</h2>
            <Link to={`/collections/${data.featuredCollection.handle}`}>
              Explore collection
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: BEST_SELLING) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
`;

/** @typedef {import('./+types/_index').Route} Route */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
