import { defineField, defineType } from 'sanity';

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'title',
      title: 'Page title',
      type: 'string',
      description: 'Shows as the browser tab title and in Google results. ~55 chars.',
      validation: (r) => r.max(70),
    }),
    defineField({
      name: 'description',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'The summary that appears under the title in Google. ~155 chars.',
      validation: (r) => r.max(180),
    }),
    defineField({
      name: 'ogImage',
      title: 'Social preview image',
      type: 'imageWithCaption',
      description: 'Used when the page is shared on Facebook, WhatsApp, LinkedIn.',
    }),
    defineField({
      name: 'noindex',
      title: 'Hide from search engines',
      type: 'boolean',
      initialValue: false,
    }),
  ],
});
