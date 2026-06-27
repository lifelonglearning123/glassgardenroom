import { defineField, defineType } from 'sanity';

export const editorialBlock = defineType({
  name: 'editorialBlock',
  title: 'Editorial block',
  type: 'object',
  fields: [
    defineField({
      name: 'eyebrow',
      type: 'string',
      description: 'Small label above the heading, e.g. "№ 01 · Premium Glass Room".',
    }),
    defineField({
      name: 'heading',
      type: 'richText',
      description: 'Use italic for emphasis, e.g. "Quietly engineered. *Endlessly bespoke.*"',
    }),
    defineField({
      name: 'body',
      type: 'richText',
    }),
    defineField({
      name: 'image',
      type: 'imageWithCaption',
    }),
    defineField({
      name: 'imagePosition',
      type: 'string',
      options: {
        list: [
          { title: 'Image on left',  value: 'left' },
          { title: 'Image on right', value: 'right' },
          { title: 'Full bleed',     value: 'full-bleed' },
          { title: 'No image',       value: 'none' },
        ],
        layout: 'radio',
      },
      initialValue: 'right',
    }),
    defineField({
      name: 'cta',
      title: 'Call to action',
      type: 'cta',
    }),
  ],
  preview: {
    select: { title: 'eyebrow', media: 'image.asset' },
    prepare: ({ title, media }) => ({
      title: title || 'Editorial block',
      media,
    }),
  },
});
