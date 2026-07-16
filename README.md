# Codex Micro Clicker

I couldn’t afford the real thing, so I made this instead. Nothing special—it just looks nice.

흰 화면에서 키를 누르고, 다이얼과 조이스틱을 움직이고, 가끔 켜지는 상태 조명을 감상하는 비공식·비상업 웹 목업입니다. 실제 Codex 연결, 단축키, 저장, 분석, 광고, 결제 또는 백엔드 기능은 없습니다.

## Controls

- 12 keys: click, touch, `Enter`, or `Space`
- Black dial: drag, mouse wheel, or arrow keys
- White joystick: drag or arrow keys
- Touch sensor: click, touch, `Enter`, or `Space`
- Audio starts only after the first user gesture

## Development

Node.js 22.13 이상이 필요합니다.

```bash
npm install
npm run dev
npm run lint
npm test
```

배포 빌드는 두 종류입니다.

```bash
npm run build:sites  # dist/server/index.js
npm run build:pages  # out/
```

`main` 브랜치 변경은 GitHub Pages 워크플로로 자동 배포됩니다. Codex Sites 미러는 별도 재배포가 필요합니다.

## Notice

This is an unofficial, non-commercial fan mockup and is not affiliated with or endorsed by OpenAI or Work Louder. Product references remain the property of their respective owners. Public reuse rights are not granted merely because this project is non-commercial or removes a logo.

- [OpenAI × Work Louder product page](https://openai.com/ko-KR/supply/co-lab/work-louder/)
- [Work Louder Codex Micro](https://worklouder.cc/codex-micro)
- [OpenAI brand guidelines](https://openai.com/brand/)
- [Work Louder terms](https://worklouder.cc/terms-of-services)
