// Application imports are resolved by Next in production. Resolve the same .js
// files when exercising server modules directly with Node 22+.
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  try { return next(specifier, context); }
  catch (error) {
    if ((specifier.startsWith('.') || specifier.startsWith('next/')) && !specifier.endsWith('.js') && error.code === 'ERR_MODULE_NOT_FOUND') return next(`${specifier}.js`, context);
    throw error;
  }
} });
