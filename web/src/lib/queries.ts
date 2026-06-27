// Reusable GROQ projections + queries.
// Keep these in one place so schema changes show up here first.

export const ctaProjection = `{
  label,
  href,
  variant,
  external
}`;

export const imageProjection = `{
  asset,
  alt,
  caption,
  "url": asset->url,
  "lqip": asset->metadata.lqip,
  "dimensions": asset->metadata.dimensions
}`;

export const seoProjection = `{
  title,
  description,
  ogImage${imageProjection},
  noindex
}`;

export const siteSettingsQuery = `*[_type == "siteSettings"][0]{
  businessName,
  phone,
  email,
  address,
  showroomHours,
  masthead{
    logo${imageProjection},
    nav[]{ label, href },
    ctaLabel,
    ctaHref
  },
  footer,
  trustBadges[]{ label, icon${imageProjection} },
  defaultSeo${seoProjection}
}`;

export const homePageQuery = `*[_type == "homePage"][0]{
  cinematicHero{
    "videoUrl": video.asset->url,
    posterImage${imageProjection},
    metaLabels,
    headline,
    lede,
    ctas[]${ctaProjection},
    creditLine
  },
  tickertape,
  usps[]{ number, title, body },
  "featuredProducts": featuredProducts[]->{
    _id, name, slug, catalogueNumber, strapline, fromPrice,
    heroImage${imageProjection}
  },
  "featuredTestimonials": featuredTestimonials[]->{
    _id, customerName, location, quote, rating
  },
  journalTeaser{
    heading,
    autoPopulate,
    "posts": select(
      autoPopulate => *[_type == "journalPost"] | order(publishedAt desc)[0...3]{
        _id, title, slug, publishedAt, excerpt, heroImage${imageProjection}
      },
      manualPosts[]->{
        _id, title, slug, publishedAt, excerpt, heroImage${imageProjection}
      }
    )
  },
  seo${seoProjection}
}`;

export const productBySlugQuery = `*[_type == "product" && slug.current == $slug][0]{
  ...,
  heroImage${imageProjection},
  lifestyleGallery{
    majorImage${imageProjection},
    minorImages[]${imageProjection}
  },
  moment{
    backgroundImage${imageProjection},
    eyebrow, heading, body
  },
  editorial[]{
    eyebrow, heading, body,
    image${imageProjection},
    imagePosition,
    cta${ctaProjection}
  },
  ctas[]${ctaProjection},
  seo${seoProjection}
}`;

export const productsByCategoryQuery = `*[_type == "product" && category == $category] | order(catalogueNumber asc){
  _id, name, slug, catalogueNumber, strapline, fromPrice,
  heroImage${imageProjection}
}`;

export const allProductsQuery = `*[_type == "product"] | order(category asc, catalogueNumber asc){
  _id, name, slug, category, catalogueNumber, strapline, fromPrice,
  heroImage${imageProjection}
}`;

export const faqQuery = `*[_type == "faq"][0]{
  intro,
  sections[]{ number, title, meta, items[]{ question, answer } },
  seo${seoProjection}
}`;

export const contactPageQuery = `*[_type == "contactPage"][0]{
  ...,
  seo${seoProjection}
}`;

export const installationPageQuery = `*[_type == "installationPage"][0]{
  ...,
  seo${seoProjection}
}`;

export const financePageQuery = `*[_type == "financePage"][0]{
  ...,
  seo${seoProjection}
}`;

export const productsPageQuery = `*[_type == "productsPage"][0]{
  ...,
  seo${seoProjection}
}`;

export const journalListQuery = `*[_type == "journalPost"] | order(publishedAt desc){
  _id, title, slug, publishedAt, author, volumeNumber, excerpt,
  heroImage${imageProjection}
}`;

export const journalPostBySlugQuery = `*[_type == "journalPost" && slug.current == $slug][0]{
  ...,
  heroImage${imageProjection},
  "relatedProducts": relatedProducts[]->{
    _id, name, slug, strapline, heroImage${imageProjection}
  },
  seo${seoProjection}
}`;
