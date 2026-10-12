-- 펫캠 영상 연결 정보는 "petcam:<사용자 id>:<세션 id>" 채널로 주고받는다.
-- 로그인한 사용자가 본인 id로 시작하는 채널에서만 메시지를 받고 보낼 수 있게 한다.

drop policy if exists "petcam members can receive broadcasts" on realtime.messages;
create policy "petcam members can receive broadcasts"
on realtime.messages
for select
to authenticated
using (
	realtime.messages.extension = 'broadcast'
	and split_part(realtime.topic(), ':', 1) = 'petcam'
	and split_part(realtime.topic(), ':', 2) = (select auth.uid())::text
);

drop policy if exists "petcam members can send broadcasts" on realtime.messages;
create policy "petcam members can send broadcasts"
on realtime.messages
for insert
to authenticated
with check (
	realtime.messages.extension = 'broadcast'
	and split_part(realtime.topic(), ':', 1) = 'petcam'
	and split_part(realtime.topic(), ':', 2) = (select auth.uid())::text
);
