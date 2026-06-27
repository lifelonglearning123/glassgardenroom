import { defineArrayMember, defineType } from 'sanity';

// Portable Text — rich text with italic emphasis (used heavily in headlines),
// links, images, and basic block styles.
export const richText = defineType({
  name: 'richText',
  title: 'Rich text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'Lede (large intro)', value: 'lede' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Italic', value: 'em' },
          { title: 'Display italic', value: 'italicDisplay' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              { name: 'href', type: 'string', title: 'URL' },
              { name: 'external', type: 'boolean', title: 'Opens in new tab', initialValue: false },
            ],
          },
        ],
      },
    }),
    defineArrayMember({ type: 'imageWithCaption' }),
  ],
});
