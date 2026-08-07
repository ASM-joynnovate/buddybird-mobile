// 수집 서버 업로드의 multipart 전송 골격 (SPEC-0002). I/O 전용.
// 판정은 하지 않는다 — 응답에서 무엇을 읽을지는 호출부가 `readResponse` 로 넘기고,
// 그 결과를 어떻게 해석할지는 각 파이프라인의 response 모듈이 한다.

export interface PostUploadFormInput<T> {
  url: string;
  form: FormData;
  /** 플랫폼 fetch 기본값에 맡기면 무응답 서버에 flush 가 무기한 잡힌다 — 페이로드 크기별로 다르다 */
  timeoutMs: number;
  /** 네트워크 오류 로그의 scope (`console.warn('[scope]', error)`) */
  scope: string;
  /**
   * 응답에서 호출부가 필요한 값을 뽑는다. **타임아웃 창 안에서 실행된다** —
   * 본문을 다 받기 전에 서버가 멎으면 여기서 멈추므로, 전송만 감싸고 본문 읽기를 밖에 두면
   * flush 가 영영 끝나지 않는다. 본문 파싱 실패는 여기서 흡수해 값으로 돌려준다.
   */
  readResponse: (response: Response) => Promise<T>;
}

/**
 * multipart form 을 POST 하고 `readResponse` 가 뽑아낸 값을 돌려준다.
 * 네트워크 오류와 타임아웃 abort 는 `null` 로 흡수하며 여기서 throw 하지 않는다 —
 * 호출부는 둘을 구분하지 않고 "응답 없음"으로 처리한다.
 */
export async function postUploadForm<T>(input: PostUploadFormInput<T>): Promise<T | null> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), input.timeoutMs);
  try {
    const response = await fetch(input.url, {
      method: 'POST',
      body: input.form,
      signal: abortController.signal,
    });
    return await input.readResponse(response);
  } catch (error: unknown) {
    console.warn(`[${input.scope}]`, error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
