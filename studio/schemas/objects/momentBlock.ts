import { defineField, defineType } from 'sanity';

// Full-bleed atmospheric section with a backdrop image and short copy.
export const momentBlock = defineType({
  name: 'momentBlock',
  title: 'Moment',
  type: 'object',
  fields: [
    defineField({
      name: 'backgroundImage',
      type: 'imageWithCaption',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'eyebrow',
      type: 'string',
      description: 'Small label, e.g. "Year-round · 18°C inside".',
    }),
    defineField({
      name: 'heading',
      type: 'richText',
    }),
    defineField({
      name: 'body',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: { title: 'eyebrow', media: 'backgroundImage.asset' },
    prepare: ({ title, media }) => ({
      title: title || 'Moment',
      media,
    }),
  },
});
