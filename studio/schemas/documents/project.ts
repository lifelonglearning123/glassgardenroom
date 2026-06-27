import { defineField, defineType } from 'sanity';

// Completed installations — used for case-study / gallery sections.
export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title', maxLength: 80 },
    }),
    defineField({ name: 'location', type: 'string', description: 'e.g. "Solihull"' }),
    defineField({
      name: 'projectType',
      type: 'reference',
      to: [{ type: 'product' }],
    }),
    defineField({ name: 'completedOn', type: 'date' }),
    defineField({ name: 'heroImage', type: 'imageWithCaption' }),
    defineField({
      name: 'gallery',
      type: 'array',
      of: [{ type: 'imageWithCaption' }],
    }),
    defineField({ name: 'description', type: 'richText' }),
    defineField({ name: 'specs', type: 'array', of: [{
      type: 'object',
      fields: [
        { name: 'label', type: 'string' },
        { name: 'value', type: 'string' },
      ],
    }]}),
  ],
  preview: {
    select: { title: 'title', subtitle: 'location', media: 'heroImage.asset' },
  },
});
