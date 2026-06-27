import { defineField, defineType } from 'sanity';

// Catalogue index page — products themselves live as a separate collection.
export const productsPage = defineType({
  name: 'productsPage',
  title: 'Products page',
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
      name: 'categoryOrder',
      title: 'Category display order',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Glass Garden Rooms', value: 'glass-room' },
          { title: 'Verandas',           value: 'veranda' },
          { title: 'Carports',           value: 'carport' },
        ],
      },
    }),
    defineField({
      name: 'categoryIntros',
      title: 'Per-category intros',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {
            name: 'category',
            type: 'string',
            options: {
              list: [
                { title: 'Glass Garden Rooms', value: 'glass-room' },
                { title: 'Verandas',           value: 'veranda' },
                { title: 'Carports',           value: 'carport' },
              ],
            },
          },
          { name: 'eyebrow', type: 'string' },
          { name: 'heading', type: 'richText' },
          { name: 'body',    type: 'richText' },
        ],
        preview: { select: { title: 'category' } },
      }],
    }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Products page' }) },
});
