import * as objects from './objects';
import * as documents from './documents';

export const schemaTypes = [
  // Reusable objects
  objects.cta,
  objects.imageWithCaption,
  objects.gallery,
  objects.seo,
  objects.richText,
  objects.editorialBlock,
  objects.momentBlock,

  // Singletons
  documents.siteSettings,
  documents.homePage,
  documents.productsPage,
  documents.installationPage,
  documents.financePage,
  documents.contactPage,
  documents.faq,

  // Collections
  documents.product,
  documents.testimonial,
  documents.project,
  documents.journalPost,
];
