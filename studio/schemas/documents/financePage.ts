import { defineField, defineType } from 'sanity';

export const financePage = defineType({
  name: 'financePage',
  title: 'Finance page',
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
      name: 'examples',
      title: 'Finance examples',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'projectAmount', type: 'number', title: 'Project total (£)' },
          { name: 'term',          type: 'string', description: 'e.g. "120 months"' },
          { name: 'apr',           type: 'string', description: 'e.g. "11.9% APR"' },
          { name: 'monthly',       type: 'string', description: 'e.g. "£162 / month"' },
          { name: 'totalPayable',  type: 'string', description: 'e.g. "£19,440"' },
        ],
        preview: { select: { title: 'projectAmount', subtitle: 'monthly' } },
      }],
    }),
    defineField({
      name: 'editorial',
      type: 'array',
      of: [{ type: 'editorialBlock' }],
    }),
    defineField({
      name: 'legal',
      title: 'Regulatory text',
      type: 'richText',
      description: 'FCA disclaimers, lender info, etc.',
    }),
    defineField({ name: 'ctas', type: 'array', of: [{ type: 'cta' }] }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Finance page' }) },
});
