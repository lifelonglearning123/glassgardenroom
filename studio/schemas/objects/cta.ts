import { defineField, defineType } from 'sanity';

export const cta = defineType({
  name: 'cta',
  title: 'Call to action',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'href',
      title: 'Link',
      type: 'string',
      description: 'Internal path like /contact or full URL like https://…',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'variant',
      title: 'Button style',
      type: 'string',
      options: {
        list: [
          { title: 'Bone (filled)',        value: 'btn-bone' },
          { title: 'Bone (outline)',       value: 'btn-outline-bone' },
          { title: 'Ghost',                value: 'btn-ghost' },
          { title: 'Mini (header style)',  value: 'cta-mini' },
        ],
        layout: 'radio',
      },
      initialValue: 'btn-bone',
    }),
    defineField({
      name: 'external',
      title: 'Opens in new tab',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: 'label', subtitle: 'href' },
  },
});
