import { createUploadthing, UploadThingError } from 'uploadthing/server';
import type { FileRouter } from 'uploadthing/server';
import { auth } from '~/auth/auth';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const uploadRouter = {
  // Uploader for images only
  fileUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      // If you throw, the user will not be able to upload
      if (!session?.user) throw new UploadThingError('Unauthorized');

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log('Upload complete for userId:', metadata.userId);
      console.log('file url', file.url);
      console.log('file type', file.type);
      console.log('file name', file.name);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return {
        uploadedBy: metadata.userId,
        url: file.url,
        name: file.name,
        type: file.type,
        size: file.size,
      };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
