import { defineField, defineType } from 'sanity';

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({ name: 'customerName', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'location', type: 'string', description: 'e.g. "Solihull"' }),
    defineField({
      name: 'projectType',
      title: 'Product they bought',
      type: 'reference',
      to: [{ type: 'product' }],
    }),
    defineField({
      name: 'quote',
      type: 'text',
      rows: 4,
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'rating',
      type: 'number',
      validation: (r) => r.min(1).max(5).integer(),
      options: {
        list: [1, 2, 3, 4, 5],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 5,
    }),
    defineField({ name: 'photo', type: 'imageWithCaption' }),
    defineField({ name: 'date', type: 'date' }),
    defineField({
      name: 'featured',
      title: 'Feature on home page',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: 'customerName', subtitle: 'location', media: 'photo.asset' },
  },
});
