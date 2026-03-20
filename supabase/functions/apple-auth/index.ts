// @deno-types="npm:@supabase/supabase-js@2"
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {name: 'ECDSA', namedCurve: 'P-256'},
    false,
    ['sign'],
  );
}

function base64url(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateClientSecret(): Promise<string> {
  const teamId = Deno.env.get('APPLE_TEAM_ID')!;
  const keyId = Deno.env.get('APPLE_KEY_ID')!;
  const serviceId = Deno.env.get('APPLE_SERVICE_ID')!;
  const privateKeyPem = Deno.env.get('APPLE_PRIVATE_KEY')!;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({alg: 'ES256', kid: keyId}));
  const payload = base64url(
    JSON.stringify({
      iss: teamId,
      iat: now,
      exp: now + 15_777_000,
      aud: 'https://appleid.apple.com',
      sub: serviceId,
    }),
  );

  const message = `${header}.${payload}`;
  const privateKey = await importPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign(
    {name: 'ECDSA', hash: 'SHA-256'},
    privateKey,
    new TextEncoder().encode(message),
  );

  return `${message}.${base64url(new Uint8Array(signature))}`;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {global: {headers: {Authorization: authHeader}}},
    );
    const {
      data: {user},
    } = await userSupabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const {action, authorization_code} = await req.json();
    const clientSecret = await generateClientSecret();
    const serviceId = Deno.env.get('APPLE_SERVICE_ID')!;

    if (action === 'exchange') {
      const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
          client_id: serviceId,
          client_secret: clientSecret,
          code: authorization_code,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenRes.json();

      if (tokens.error) {
        throw new Error(`Apple token exchange failed: ${tokens.error}`);
      }

      if (tokens.refresh_token) {
        await serviceSupabase
          .from('users')
          .update({apple_refresh_token: tokens.refresh_token})
          .eq('id', user.id);
      }

      return new Response(JSON.stringify({success: true}), {
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
      });
    }

    if (action === 'revoke') {
      const {data} = await serviceSupabase
        .from('users')
        .select('apple_refresh_token')
        .eq('id', user.id)
        .single();

      if (data?.apple_refresh_token) {
        await fetch('https://appleid.apple.com/auth/revoke', {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: new URLSearchParams({
            client_id: serviceId,
            client_secret: clientSecret,
            token: data.apple_refresh_token,
            token_type_hint: 'refresh_token',
          }),
        });
      }

      return new Response(JSON.stringify({success: true}), {
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
      });
    }

    throw new Error('Invalid action');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({error: message}), {
      status: 500,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  }
});
