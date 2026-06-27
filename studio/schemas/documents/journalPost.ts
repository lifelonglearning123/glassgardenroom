import { defineField, defineType } from 'sanity';

export const journalPost = defineType({
  name: 'journalPost',
  title: 'Journal post',
  type: 'document',
  groups: [
    { name: 'basics', title: 'Basics', default: true },
    { name: 'body',   title: 'Body' },
    { name: 'related', title: 'Related' },
    { name: 'seo',    title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', type: 'string', group: 'basics', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'basics',
      options: { source: 'title', maxLength: 80 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published date',
      type: 'datetime',
      group: 'basics',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({ name: 'author', type: 'string', group: 'basics' }),
    defineField({ name: 'volumeNumber', title: 'Volume label', type: 'string', group: 'basics', description: 'e.g. "Vol. 01"' }),

    defineField({ name: 'heroImage', type: 'imageWithCaption', group: 'body' }),
    defineField({
      name: 'excerpt',
      title: 'Short summary',
      type: 'text',
      rows: 3,
      group: 'body',
      description: 'Shown on the journal listing page.',
    }),
    defineField({ name: 'body', type: 'richText', group: 'body' }),

    defineField({
      name: 'relatedProducts',
      type: 'array',
      group: 'related',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
    }),

    defineField({ name: 'seo', type: 'seo', group: 'seo' }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'newestFirst',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', media: 'heroImage.asset' },
    prepare: ({ title, subtitle, media }) => ({
      title,
      subtitle: subtitle ? new Date(subtitle).toLocaleDateString('en-GB') : undefined,
      media,
    }),
  },
});
