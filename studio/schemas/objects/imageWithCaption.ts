import { defineField, defineType } from 'sanity';

export const imageWithCaption = defineType({
  name: 'imageWithCaption',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({
      name: 'asset',
      title: 'Image file',
      type: 'image',
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Describe the image for screen readers and SEO.',
      validation: (r) => r.required().min(4),
    }),
    defineField({
      name: 'caption',
      type: 'string',
      description: 'Optional small caption shown below the image.',
    }),
  ],
  preview: {
    select: { title: 'alt', subtitle: 'caption', media: 'asset' },
  },
});
