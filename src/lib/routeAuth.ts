import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export class AuthError extends Error {
  constructor(
    public readonly statusCode: 401 | 403 | 404,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Verifies the request is from an authenticated user who owns the given blueprint.
 * Must be called before any admin-client DB operation in a route handler.
 *
 * @throws AuthError (401) if not authenticated
 * @throws AuthError (403) if authenticated but does not own the blueprint
 * @throws AuthError (404) if the blueprint does not exist
 */
export async function requireBlueprintOwner(
  blueprintId: string
): Promise<{ userId: string }> {
  const cookieStore = await cookies();

  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) throw new AuthError(401, 'Unauthenticated');

  const admin = createAdminClient();
  const { data: bp, error } = await admin
    .from('blueprint_generator')
    .select('user_id')
    .eq('id', blueprintId)
    .single();

  if (error || !bp) throw new AuthError(404, 'Blueprint not found');
  if (bp.user_id !== user.id) throw new AuthError(403, 'Forbidden');

  return { userId: user.id };
}

/**
 * Verifies the request is authenticated (no blueprint ownership check).
 * Use when a route writes global (blueprint-unattached) assets.
 */
export async function requireAuth(): Promise<{ userId: string }> {
  const cookieStore = await cookies();

  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) throw new AuthError(401, 'Unauthenticated');
  return { userId: user.id };
}

/** Converts an AuthError into a NextResponse. Re-throws anything else. */
export function authErrorResponse(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
  throw err;
}
