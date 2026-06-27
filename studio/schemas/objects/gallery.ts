import { defineField, defineType } from 'sanity';

export const gallery = defineType({
  name: 'gallery',
  title: 'Lifestyle gallery',
  type: 'object',
  fields: [
    defineField({
      name: 'majorImage',
      title: 'Major image (large left)',
      type: 'imageWithCaption',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'minorImages',
      title: 'Minor images (stacked right)',
      type: 'array',
      of: [{ type: 'imageWithCaption' }],
      validation: (r) => r.min(1).max(4),
    }),
  ],
});
