# 공통 TURN 인증정보 발급

운영자 Cloudflare 계정의 TURN 키를 사용한다. 게임의 Firebase ID token을 검증한 사용자에게만 24시간 유효한 TURN 인증정보를 반환한다.

## 설정

Cloudflare Realtime 서비스 활성화 후 TURN 키를 생성한다. `TURN_KEY_ID`와 `TURN_API_TOKEN`을 이 Worker의 Secrets로 등록한다. `wrangler.jsonc`를 기준으로 배포하며, `/v1/ice`에 게임 ID token을 `Authorization: Bearer ...`로 전달한다.

요청 제한은 사용자와 IP마다 Cloudflare 위치별 분당 10회다. 이 제한은 발급 요청을 제한하며, 정확한 전송량 한도나 비용 상한은 보장하지 않는다. 발급받은 인증정보는 유효기간 동안 재사용할 수 있다.

게임 로그인 토큰은 메모리에서 검증하며 저장하지 않는다. 확장 프로그램에 연결할 때 게임 로그인 토큰이 운영자 Worker로 전달됨을 개인정보 처리 안내에 반영해야 한다.

## 검증 범위

`node --test tests/turn-credentials.test.mjs`로 서명된 로그인 토큰 검증, 잘못된 대상·만료·형식 거부, 요청 제한, Cloudflare 오류 처리를 확인한다.

현재 Worker는 로컬 구현 단계다. 실제 Cloudflare 배포, Realtime 인증정보 발급, 확장 프로그램의 LAN 이후 전환 연결은 별도 검증이 필요하다.
