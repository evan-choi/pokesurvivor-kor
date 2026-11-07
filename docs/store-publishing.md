# Chrome 웹 스토어와 자동 배포

웹사이트는 `main`에 푸시하면 바로 배포합니다. 스토어 업데이트는 **최초 공개와 아래 인증 설정을 마친 뒤**, 확장 소스를 변경해 `main`에 푸시하면 업로드·심사 제출합니다. Google의 심사 승인이 공개 시점을 결정합니다. CI에서는 테스트를 실행하지 않습니다.

## 최초 등록

1. `npm run package`를 실행합니다. `dist/pokesurvivor-store-<버전>.zip`이 스토어 전용 패키지입니다. Windows 방화벽 도구는 포함하지 않습니다.
2. [개발자 콘솔의 등록 항목](https://chrome.google.com/webstore/devconsole/ef57ce72-3935-4402-98ea-8d427de2e393/onfhhekmpdnbgpklcghiejdmgnbmjhci/edit)에 ZIP을 업로드합니다. 기존에 같은 버전을 업로드했다면 중복 업로드할 필요가 없습니다.
3. 설명·카테고리·언어·스크린샷·개인정보 및 권한 사용 이유·공개 범위를 입력합니다.
4. 최초 심사 제출과 공개는 대시보드에서 완료합니다. CI는 이미 공개된 항목의 업데이트를 담당합니다.

항목 ID: `onfhhekmpdnbgpklcghiejdmgnbmjhci`. **게시자 → 설정**에서 확인한 게시자 ID는 `ef57ce72-3935-4402-98ea-8d427de2e393`입니다.

## GitHub Actions 인증 — 한 번만 설정

[Google 공식 API 설정 안내](https://developer.chrome.com/docs/webstore/using-api)에 따라 Google Cloud 프로젝트에서 Chrome Web Store API를 활성화하고 OAuth 클라이언트를 만듭니다. OAuth Playground 리디렉션 URI와 본인 OAuth 클라이언트를 사용해 `https://www.googleapis.com/auth/chromewebstore` 범위의 refresh token을 발급합니다. 확장 소유 계정으로 승인해야 합니다. 외부 앱의 동의 화면이 Testing이면 토큰이 7일 후 만료될 수 있으므로 Google의 토큰 만료 조건과 게시 상태를 확인하세요.

키·토큰은 채팅, 코드, README에 붙이지 말고 저장소 **Settings → Secrets and variables → Actions**에 입력합니다.

| 종류 | 이름 | 값 |
| --- | --- | --- |
| Variable | `CWS_PUBLISHER_ID` | `ef57ce72-3935-4402-98ea-8d427de2e393` |
| Variable | `CWS_ITEM_ID` | `onfhhekmpdnbgpklcghiejdmgnbmjhci` |
| Secret | `CWS_CLIENT_ID` | OAuth 클라이언트 ID |
| Secret | `CWS_CLIENT_SECRET` | OAuth 클라이언트 보안 비밀 |
| Secret | `CWS_REFRESH_TOKEN` | 위 범위로 발급받은 refresh token |

두 ID 변수가 없으면 스토어 작업은 건너뛰고 웹사이트만 배포됩니다. 첫 심사 제출과 secret 등록을 마친 뒤 ID 변수를 설정해 활성화하세요. 첫 심사 중 같은 버전은 중복 제출하지 않으며, 새 버전 업로드는 최초 공개 후 진행합니다. [워크플로](../.github/workflows/store.yml)의 수동 실행은 `main` 브랜치를 선택합니다.

## 공개 후 설치 버튼 연결

**Deploy website**가 매시간 공식 API의 공개 상태를 조회합니다. 공개된 버전이 `PUBLISHED`이면 한국어·영어 사이트의 설치 버튼과 안내를 스토어 설치·자동 업데이트로 전환하고 자동 재배포합니다. 심사 대기·승인 후 게시 대기·테스터 공개 상태에서는 ZIP 다운로드를 유지합니다. 이후 새 버전이 심사 중이어도 기존 공개 버전이 있으면 스토어 링크를 유지합니다.

예약 실행에서는 링크가 달라질 때만 재배포합니다. 푸시와 수동 실행도 같은 공개 상태를 반영합니다. API 조회에 실패하면 기존 홈페이지를 유지하고 다음 실행에서 재시도합니다. GitHub 예약 실행이 지연되면 전환도 늦어질 수 있습니다. `CWS_STORE_URL` 저장소 변수는 필요하지 않으며, README도 고정된 설치 페이지 주소를 사용하므로 수정할 필요가 없습니다. 수동 ZIP 다운로드는 스토어 공개 후에도 남습니다.

## 이후 업데이트

1. `extension/manifest.json`, `package.json`, `package-lock.json`의 버전을 함께 올립니다.
2. 변경에 맞는 로컬 검사를 마친 뒤 `main`에 푸시합니다.
3. **Publish Chrome extension** 작업이 패키지를 업로드하고 처리가 끝나면 심사에 제출합니다. `PENDING_REVIEW`는 심사 대기이며 공개 완료가 아닙니다.

이미 공개된 버전 또는 제출된 동일 버전은 다시 업로드하지 않습니다. 다른 버전이 심사 중이면 이를 취소하거나 덮어쓰지 않고 실패 이유를 남깁니다. 심사 후 Actions에서 최신 커밋으로 다시 실행하세요. 버전을 올리지 않고 코드를 바꾸면 스토어 업데이트는 전달되지 않습니다.

업로드 후 제출 전에 작업이 중단되면 대시보드에 초안이 남을 수 있습니다. API는 초안 버전을 조회하지 못하므로 대시보드에서 해당 초안을 확인하고 제출하거나, 새 버전으로 다시 실행합니다. 인증 만료나 API 오류도 Actions 로그 및 개발자 콘솔에서 확인합니다. API 오류 응답 본문은 인증 정보 노출을 피하기 위해 로그에 출력하지 않습니다.

## 관련 파일

- `scripts/publish-store.mjs`: 공식 v2 API 인증·상태 확인·업로드·심사 제출
- `scripts/package.mjs`: 수동 설치 ZIP, 스토어 ZIP, LAN 도구 ZIP
- `.github/workflows/pages.yml`: GitHub Pages 배포
- `.github/workflows/store.yml`: 스토어 업데이트
- `tests/publish-store.test.mjs`: 네트워크 모의 테스트, 실제 업로드 없음
