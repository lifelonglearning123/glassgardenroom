import { defineField, defineType } from 'sanity';

export const faq = defineType({
  name: 'faq',
  title: 'FAQ page',
  type: 'document',
  fields: [
    defineField({
      name: 'intro',
      title: 'Page intro',
      type: 'object',
      fields: [
        { name: 'breadcrumb',  type: 'string', description: 'e.g. "— Journal & FAQ"' },
        { name: 'volumeLabel', type: 'string', description: 'e.g. "Vol. 01"' },
        { name: 'lastUpdated', type: 'date' },
        { name: 'headline',    type: 'richText' },
        { name: 'lede',        type: 'text', rows: 3 },
      ],
    }),

    defineField({
      name: 'sections',
      title: 'FAQ sections',
      type: 'array',
      of: [{
        type: 'object',
        name: 'faqSection',
        fields: [
          { name: 'number', type: 'string', description: 'e.g. "№ 01"' },
          { name: 'title',  type: 'string' },
          { name: 'meta',   type: 'string', description: 'e.g. "Reply within 2 working days"' },
          {
            name: 'items',
            title: 'Questions',
            type: 'array',
            of: [{
              type: 'object',
              name: 'faqItem',
              fields: [
                { name: 'question', type: 'string', validation: (r) => r.required() },
                { name: 'answer',   type: 'richText' },
              ],
              preview: { select: { title: 'question' } },
            }],
          },
        ],
        preview: { select: { title: 'title', subtitle: 'number' } },
      }],
    }),

    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: {
    prepare: () => ({ title: 'FAQ page' }),
  },
});
