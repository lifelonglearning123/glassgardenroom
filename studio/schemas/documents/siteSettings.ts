import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    { name: 'business', title: 'Business', default: true },
    { name: 'masthead', title: 'Header / nav' },
    { name: 'footer',   title: 'Footer' },
    { name: 'trust',    title: 'Trust badges' },
    { name: 'seo',      title: 'SEO defaults' },
  ],
  fields: [
    defineField({
      name: 'businessName',
      type: 'string',
      group: 'business',
      initialValue: 'Glass Garden Rooms',
    }),
    defineField({
      name: 'phone',
      title: 'Phone / WhatsApp',
      type: 'string',
      group: 'business',
    }),
    defineField({
      name: 'email',
      type: 'string',
      group: 'business',
    }),
    defineField({
      name: 'address',
      title: 'Showroom address',
      type: 'object',
      group: 'business',
      fields: [
        { name: 'line1',    type: 'string' },
        { name: 'town',     type: 'string' },
        { name: 'county',   type: 'string' },
        { name: 'postcode', type: 'string' },
        { name: 'mapUrl',   type: 'url', title: 'Google Maps link' },
      ],
    }),
    defineField({
      name: 'showroomHours',
      title: 'Opening hours',
      type: 'array',
      group: 'business',
      of: [{
        type: 'object',
        fields: [
          { name: 'days',  type: 'string', title: 'Days',  description: 'e.g. "Mon–Fri"' },
          { name: 'hours', type: 'string', title: 'Hours', description: 'e.g. "9:00 – 17:00"' },
        ],
        preview: {
          select: { title: 'days', subtitle: 'hours' },
        },
      }],
    }),

    defineField({
      name: 'masthead',
      title: 'Header',
      type: 'object',
      group: 'masthead',
      fields: [
        { name: 'logo', type: 'imageWithCaption', title: 'Logo' },
        {
          name: 'nav',
          title: 'Navigation links',
          type: 'array',
          of: [{
            type: 'object',
            fields: [
              { name: 'label', type: 'string' },
              { name: 'href',  type: 'string' },
            ],
            preview: { select: { title: 'label', subtitle: 'href' } },
          }],
        },
        { name: 'ctaLabel', type: 'string', title: 'CTA button label' },
        { name: 'ctaHref',  type: 'string', title: 'CTA button link' },
      ],
    }),

    defineField({
      name: 'footer',
      type: 'object',
      group: 'footer',
      fields: [
        { name: 'tagline', type: 'text', rows: 2 },
        {
          name: 'columns',
          title: 'Footer link columns',
          type: 'array',
          of: [{
            type: 'object',
            fields: [
              { name: 'heading', type: 'string' },
              { name: 'links', type: 'array', of: [{ type: 'cta' }] },
            ],
            preview: { select: { title: 'heading' } },
          }],
        },
        { name: 'legalLine', type: 'string', title: 'Legal line', description: 'e.g. © 2026 Glass Garden Rooms Ltd. Co. No. 15487442' },
      ],
    }),

    defineField({
      name: 'trustBadges',
      title: 'Trust badges',
      type: 'array',
      group: 'trust',
      of: [{
        type: 'object',
        fields: [
          { name: 'label', type: 'string' },
          { name: 'icon',  type: 'imageWithCaption' },
        ],
        preview: { select: { title: 'label', media: 'icon.asset' } },
      }],
    }),

    defineField({
      name: 'defaultSeo',
      title: 'Default SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site settings' }),
  },
});
