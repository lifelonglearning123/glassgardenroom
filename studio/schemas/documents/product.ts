import { defineField, defineType } from 'sanity';

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  groups: [
    { name: 'basics',  title: 'Basics', default: true },
    { name: 'media',   title: 'Media' },
    { name: 'content', title: 'Page content' },
    { name: 'details', title: 'Specs & finishes' },
    { name: 'seo',     title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'name', type: 'string', group: 'basics', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'basics',
      options: { source: 'name', maxLength: 80 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'category',
      type: 'string',
      group: 'basics',
      options: {
        list: [
          { title: 'Glass Garden Room', value: 'glass-room' },
          { title: 'Veranda',           value: 'veranda' },
          { title: 'Carport',           value: 'carport' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'catalogueNumber',
      title: 'Catalogue number',
      type: 'string',
      group: 'basics',
      description: 'e.g. "№ 01" — controls ordering within the category.',
    }),
    defineField({
      name: 'strapline',
      type: 'string',
      group: 'basics',
    }),
    defineField({
      name: 'fromPrice',
      title: 'From price',
      type: 'object',
      group: 'basics',
      fields: [
        { name: 'amount', type: 'number', title: 'Amount (£)' },
        { name: 'displayPrefix', type: 'string', initialValue: 'From £' },
      ],
    }),

    defineField({ name: 'heroImage',         type: 'imageWithCaption', group: 'media' }),
    defineField({ name: 'lifestyleGallery',  type: 'gallery',          group: 'media' }),

    defineField({
      name: 'moment',
      title: 'Atmospheric "moment" section',
      type: 'momentBlock',
      group: 'content',
    }),
    defineField({
      name: 'editorial',
      title: 'Editorial blocks',
      type: 'array',
      group: 'content',
      of: [{ type: 'editorialBlock' }],
    }),

    defineField({
      name: 'specs',
      title: 'Specifications',
      type: 'array',
      group: 'details',
      of: [{
        type: 'object',
        fields: [
          { name: 'label', type: 'string' },
          { name: 'value', type: 'string' },
        ],
        preview: { select: { title: 'label', subtitle: 'value' } },
      }],
    }),
    defineField({
      name: 'features',
      type: 'array',
      group: 'details',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'finishOptions',
      title: 'Finish options',
      type: 'array',
      group: 'details',
      of: [{
        type: 'object',
        fields: [
          { name: 'name',   type: 'string' },
          { name: 'swatch', type: 'imageWithCaption' },
        ],
        preview: { select: { title: 'name', media: 'swatch.asset' } },
      }],
    }),

    defineField({
      name: 'ctas',
      title: 'Buttons',
      type: 'array',
      group: 'content',
      of: [{ type: 'cta' }],
    }),

    defineField({ name: 'seo', type: 'seo', group: 'seo' }),
  ],
  orderings: [
    {
      title: 'Catalogue order',
      name: 'catalogueOrder',
      by: [
        { field: 'category',        direction: 'asc' },
        { field: 'catalogueNumber', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'category', media: 'heroImage.asset' },
  },
});
