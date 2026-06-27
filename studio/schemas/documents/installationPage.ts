import { defineField, defineType } from 'sanity';

export const installationPage = defineType({
  name: 'installationPage',
  title: 'Installation page',
  type: 'document',
  fields: [
    defineField({
      name: 'pageHead',
      type: 'object',
      fields: [
        { name: 'breadcrumb', type: 'string' },
        { name: 'label',      type: 'string' },
        { name: 'headline',   type: 'richText' },
        { name: 'lede',       type: 'text', rows: 3 },
      ],
    }),
    defineField({
      name: 'steps',
      title: 'Installation steps',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'number', type: 'string', description: 'e.g. "№ 01"' },
          { name: 'title',  type: 'string' },
          { name: 'body',   type: 'richText' },
          { name: 'image',  type: 'imageWithCaption' },
        ],
        preview: { select: { title: 'title', subtitle: 'number', media: 'image.asset' } },
      }],
    }),
    defineField({
      name: 'editorial',
      title: 'Extra editorial blocks',
      type: 'array',
      of: [{ type: 'editorialBlock' }],
    }),
    defineField({ name: 'ctas', type: 'array', of: [{ type: 'cta' }] }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Installation page' }) },
});
