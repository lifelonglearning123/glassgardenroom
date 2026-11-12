import { listPhotos } from '@/lib/photos';
import { listQuotes } from '@/lib/quotes';
import { getTemplate, getTemplateMeta } from '@/lib/template-store';
import TemplateEditor from '@/components/TemplateEditor';

export default async function TemplatePage() {
  const [template, meta, photos, quotes] = await Promise.all([getTemplate(), getTemplateMeta(), listPhotos(), listQuotes()]);
  const latest = [...quotes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return (
    <TemplateEditor
      initial={template}
      photos={photos}
      previewToken={latest?.token}
      updatedAt={meta.updatedAt}
      updatedBy={meta.updatedBy}
    />
  );
}
