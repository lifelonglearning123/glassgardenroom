import { defineField, defineType } from 'sanity';

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  groups: [
    { name: 'hero',    title: 'Hero', default: true },
    { name: 'strip',   title: 'Ticker + USPs' },
    { name: 'feature', title: 'Featured content' },
    { name: 'seo',     title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'cinematicHero',
      title: 'Cinematic hero',
      type: 'object',
      group: 'hero',
      fields: [
        {
          name: 'video',
          title: 'Background video (MP4)',
          type: 'file',
          options: { accept: 'video/mp4' },
        },
        {
          name: 'posterImage',
          title: 'Fallback image (shown while video loads)',
          type: 'imageWithCaption',
        },
        {
          name: 'metaLabels',
          title: 'Small labels above the headline',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'e.g. "Vol. 01 — Spring / Summer 2026", "Aluminium · Glass · Light", "№ 04918"',
          validation: (r) => r.max(3),
        },
        {
          name: 'headline',
          type: 'richText',
          description: 'Use italic for emphasis, e.g. "Bring the *outdoors* in."',
        },
        {
          name: 'lede',
          title: 'Subheading paragraph',
          type: 'text',
          rows: 3,
        },
        {
          name: 'ctas',
          title: 'Buttons',
          type: 'array',
          of: [{ type: 'cta' }],
          validation: (r) => r.max(3),
        },
        {
          name: 'creditLine',
          title: 'Photo credit line',
          type: 'text',
          rows: 2,
          description: 'Small text at the bottom, e.g. "Photographed in Solihull, March 2026."',
        },
      ],
    }),

    defineField({
      name: 'tickertape',
      title: 'Scrolling phrases',
      type: 'array',
      group: 'strip',
      of: [{ type: 'string' }],
      description: '5–8 short phrases that scroll across the page.',
      validation: (r) => r.min(3).max(10),
    }),

    defineField({
      name: 'usps',
      title: '"Why us" boxes',
      type: 'array',
      group: 'strip',
      of: [{
        type: 'object',
        fields: [
          { name: 'number', type: 'string', description: 'e.g. "i.", "ii.", "iii."' },
          { name: 'title',  type: 'string' },
          { name: 'body',   type: 'text', rows: 3 },
        ],
        preview: { select: { title: 'title', subtitle: 'number' } },
      }],
      validation: (r) => r.min(3).max(4),
    }),

    defineField({
      name: 'featuredProducts',
      type: 'array',
      group: 'feature',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
      validation: (r) => r.max(4),
    }),

    defineField({
      name: 'featuredTestimonials',
      type: 'array',
      group: 'feature',
      of: [{ type: 'reference', to: [{ type: 'testimonial' }] }],
      validation: (r) => r.max(3),
    }),

    defineField({
      name: 'journalTeaser',
      title: 'Journal teaser',
      type: 'object',
      group: 'feature',
      fields: [
        { name: 'heading', type: 'string' },
        {
          name: 'autoPopulate',
          title: 'Auto-pick latest 3 posts',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'manualPosts',
          title: 'Hand-picked posts',
          type: 'array',
          of: [{ type: 'reference', to: [{ type: 'journalPost' }] }],
          hidden: ({ parent }) => parent?.autoPopulate !== false,
          validation: (r) => r.max(3),
        },
      ],
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Home page' }),
  },
});
