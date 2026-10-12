import { createClient } from 'npm:@supabase/supabase-js@2';

const CREDENTIAL_TTL_SECONDS = 86400;

/** JSON 응답을 만드는 함수 */
const json = (body: unknown, status: number) =>
	new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** 로그인한 사용자에게 펫캠 영상 중계(TURN)용 임시 접속 정보를 발급하는 함수 */
Deno.serve(async (request) => {
	const authorization = request.headers.get('Authorization');
	const supabaseUrl = Deno.env.get('SUPABASE_URL');
	const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
	const turnKeyId = Deno.env.get('CLOUDFLARE_TURN_KEY_ID');
	const turnApiToken = Deno.env.get('CLOUDFLARE_TURN_API_TOKEN');

	if (!supabaseUrl || !supabaseKey || !turnKeyId || !turnApiToken) {
		console.error('[petcam-turn] configuration missing');

		return json({ error: 'configuration_missing' }, 500);
	}

	if (!authorization) {
		return json({ error: 'unauthorized' }, 401);
	}

	// 공개 키만으로는 발급받지 못하도록 로그인한 사용자인지 확인
	const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authorization } } });
	const { data, error } = await supabase.auth.getUser();

	if (error || !data.user) {
		return json({ error: 'unauthorized' }, 401);
	}

	const response = await fetch(
		`https://rtc.live.cloudflare.com/v1/turn/keys/${turnKeyId}/credentials/generate-ice-servers`,
		{
			method: 'POST',
			headers: { 'Authorization': `Bearer ${turnApiToken}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ ttl: CREDENTIAL_TTL_SECONDS }),
		},
	);

	if (!response.ok) {
		console.error('[petcam-turn] cloudflare responded', response.status);

		return json({ error: 'turn_unavailable' }, 502);
	}

	const { iceServers } = (await response.json()) as { iceServers: unknown };

	return json({ iceServers }, 200);
});
