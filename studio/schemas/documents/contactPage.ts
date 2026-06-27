import { defineField, defineType } from 'sanity';

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact page',
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
      name: 'showroomBlock',
      title: 'Showroom block',
      type: 'object',
      description: 'Address + hours can be left blank to inherit from Site Settings.',
      fields: [
        { name: 'heading', type: 'string' },
        { name: 'directions', type: 'richText' },
        { name: 'image', type: 'imageWithCaption' },
      ],
    }),
    defineField({
      name: 'formBlock',
      title: 'Form block',
      type: 'object',
      description: 'The form behaviour itself (GHL webhook) is wired in code and is not editable here.',
      fields: [
        { name: 'heading',   type: 'string' },
        { name: 'intro',     type: 'richText' },
        { name: 'successMessage', type: 'string', description: 'Shown after the form submits.' },
      ],
    }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Contact page' }) },
});
