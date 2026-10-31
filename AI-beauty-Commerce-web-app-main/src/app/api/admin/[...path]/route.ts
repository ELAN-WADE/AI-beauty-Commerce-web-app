// Use the persistent backend session and its authorization checks for every request.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export { GET, POST, PATCH, PUT, DELETE, OPTIONS } from '../../[...path]/route';
