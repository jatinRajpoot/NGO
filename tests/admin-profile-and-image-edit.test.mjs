import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Setup isolated environment variables before importing modules
const testDir = await mkdtemp(path.join(tmpdir(), 'gsdd-profile-test-'));
const testPassword = 'OriginalSecretPassword123';
const salt = randomBytes(16).toString('hex');
const passwordHash = `${salt}:${scryptSync(testPassword, salt, 64).toString('hex')}`;
const sessionSecret = randomBytes(48).toString('hex');

process.env.NODE_ENV = 'development';
process.env.GALLERY_BUCKET = '';
process.env.GALLERY_DATA_DIR = path.join(testDir, 'gallery');
process.env.ADMIN_DATA_DIR = testDir;
process.env.ADMIN_USERNAME = 'test-admin';
process.env.ADMIN_PASSWORD_HASH = passwordHash;
process.env.ADMIN_SESSION_SECRET = sessionSecret;

const {
  verifyCredentials,
  updateAdminPassword,
  getAdminProfile,
} = await import('../app/lib/admin-auth.js');

const {
  addGalleryPhoto,
  updateGalleryPhoto,
  listGalleryPhotos,
  removeGalleryPhoto,
} = await import('../app/lib/gallery-store.js');

try {
  console.log('--- Testing Administrator Profile & Password Update ---');

  // 1. Initial credentials verification
  const initialValid = await verifyCredentials('test-admin', testPassword);
  assert.equal(initialValid, true, 'Initial password should verify correctly');

  const initialWrong = await verifyCredentials('test-admin', 'WrongPassword!');
  assert.equal(initialWrong, false, 'Wrong password should fail verification');

  // 2. Profile metadata
  const profile = getAdminProfile();
  assert.ok(profile, 'Profile should be available');
  assert.equal(profile.username, 'test-admin');
  assert.equal(profile.role, 'Super Administrator');

  // 3. Password update validation errors
  const failWrongOld = await updateAdminPassword('WrongCurrentPass', 'NewValidPass1234');
  assert.equal(failWrongOld.ok, false);
  assert.equal(failWrongOld.error, 'invalid_current_password');

  const failTooShort = await updateAdminPassword(testPassword, 'short');
  assert.equal(failTooShort.ok, false);
  assert.equal(failTooShort.error, 'invalid_new_password');

  const failSame = await updateAdminPassword(testPassword, testPassword);
  assert.equal(failSame.ok, false);
  assert.equal(failSame.error, 'same_as_current');

  // 4. Successful password update
  const newSecretPassword = 'BrandNewSecurePassword2026!';
  const updateSuccess = await updateAdminPassword(testPassword, newSecretPassword);
  assert.equal(updateSuccess.ok, true, 'Password update should succeed');

  // 5. Verify new password works and old password fails
  const verifyOldAfterUpdate = await verifyCredentials('test-admin', testPassword);
  assert.equal(verifyOldAfterUpdate, false, 'Old password should no longer be accepted');

  const verifyNewAfterUpdate = await verifyCredentials('test-admin', newSecretPassword);
  assert.equal(verifyNewAfterUpdate, true, 'New password must verify successfully');

  console.log('PASS: Password update and credential verification tests passed.');

  console.log('--- Testing Gallery Image Modification ---');

  // 6. Create a valid test image (1x1 transparent PNG)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);

  const added = await addGalleryPhoto({
    buffer: pngHeader,
    contentType: 'image/png',
    extension: 'png',
    date: '2026-10-31',
    alt: 'Original initial description before modification',
  });

  assert.ok(added?.id, 'Photo should be added with valid ID');
  assert.equal(added.date, '2026-10-31');
  assert.equal(added.alt, 'Original initial description before modification');

  // 7. Modify metadata of the uploaded photo
  const updatedMeta = await updateGalleryPhoto({
    id: added.id,
    date: '2026-11-01',
    alt: 'Updated description for community skills session',
  });

  assert.ok(updatedMeta, 'updateGalleryPhoto should return updated record');
  assert.equal(updatedMeta.id, added.id);
  assert.equal(updatedMeta.date, '2026-11-01', 'Date should be updated');
  assert.equal(updatedMeta.alt, 'Updated description for community skills session', 'Alt should be updated');

  // Verify listGalleryPhotos returns the updated metadata
  const listAfterMeta = await listGalleryPhotos();
  const foundPhoto = listAfterMeta.find((p) => p.id === added.id);
  assert.ok(foundPhoto, 'Modified photo should exist in photo list');
  assert.equal(foundPhoto.date, '2026-11-01');
  assert.equal(foundPhoto.alt, 'Updated description for community skills session');

  // 8. Modify with image replacement (replace with JPEG)
  const jpegHeader = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  ]);

  const updatedWithFile = await updateGalleryPhoto({
    id: added.id,
    alt: 'Final updated description with JPEG replacement',
    date: '2026-11-05',
    buffer: jpegHeader,
    contentType: 'image/jpeg',
    extension: 'jpg',
  });

  assert.ok(updatedWithFile, 'Photo update with file replacement should succeed');
  assert.equal(updatedWithFile.alt, 'Final updated description with JPEG replacement');
  assert.equal(updatedWithFile.date, '2026-11-05');
  assert.ok(updatedWithFile.src.endsWith('.jpg'), 'Source should reflect new extension');

  // 9. Validation rejections
  await assert.rejects(
    async () => updateGalleryPhoto({ id: added.id, date: 'not-a-date' }),
    /Invalid date/
  );

  await assert.rejects(
    async () => updateGalleryPhoto({ id: added.id, alt: '' }),
    /description is required/
  );

  // 10. Non-existent photo update returns null
  const notFound = await updateGalleryPhoto({ id: 'non-existent-photo-uuid', alt: 'Test' });
  assert.equal(notFound, null, 'Updating non-existent photo should return null');

  // Clean up uploaded test photo
  await removeGalleryPhoto(added.id);

  console.log('PASS: All image modification tests passed successfully.');
} finally {
  try {
    await rm(testDir, { recursive: true, force: true });
  } catch {}
}
