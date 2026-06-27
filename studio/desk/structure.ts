import type { StructureResolver } from 'sanity/structure';

// Singletons — one document each, pinned to the top of the sidebar.
const SINGLETONS = [
  { id: 'homePage',         title: 'Home',         icon: '🏠' },
  { id: 'productsPage',     title: 'Products',     icon: '📐' },
  { id: 'installationPage', title: 'Installation', icon: '🔧' },
  { id: 'financePage',      title: 'Finance',      icon: '💷' },
  { id: 'contactPage',      title: 'Contact',      icon: '✉️' },
  { id: 'faq',              title: 'FAQ',          icon: '❓' },
] as const;

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Pages')
        .child(
          S.list()
            .title('Pages')
            .items(
              SINGLETONS.map(({ id, title }) =>
                S.listItem()
                  .title(title)
                  .id(id)
                  .child(S.document().schemaType(id).documentId(id))
              )
            )
        ),

      S.divider(),

      S.listItem()
        .title('Catalogue')
        .child(S.documentTypeList('product').title('Products')),

      S.listItem()
        .title('Testimonials')
        .child(S.documentTypeList('testimonial').title('Testimonials')),

      S.listItem()
        .title('Journal')
        .child(S.documentTypeList('journalPost').title('Journal posts')),

      S.listItem()
        .title('Projects')
        .child(S.documentTypeList('project').title('Completed projects')),

      S.divider(),

      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(
          S.document().schemaType('siteSettings').documentId('siteSettings')
        ),
    ]);

export const SINGLETON_IDS = SINGLETONS.map((s) => s.id);
