import { blobConfigured, listPhotos } from '@/lib/photos';
import PhotoLibrary from '@/components/PhotoLibrary';

export default async function PhotosPage() {
  const photos = await listPhotos();
  const canUpload = blobConfigured() || !process.env.VERCEL;
  return <PhotoLibrary initial={photos} canUpload={canUpload} />;
}
