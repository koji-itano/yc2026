# Cactus Compute — On-Device AI for Smartphones, Laptops & Edge

- **Website**: https://cactuscompute.com/
- **Docs v1.7**: https://cactuscompute.com/docs/v1.7
- **GitHub**: https://github.com/cactus-compute/cactus (4.4K stars)
- **Discord**: https://discord.gg/bNurx3AXTJ
- **Hackathon**: Tool award category
- **Background**: YC S25
- **Judge**: Henry Ndubuaku (Co-Founder/CTO)
- **Note**: Free cloud fallback for March 2026

---

## What It Is

On-device AI with cloud fallback. Deploy speech, vision, and text models with a single toolkit. <120ms latency on-device.

## Three-Layer Architecture

1. **Cactus Engine**: OpenAI-compatible APIs for C/C++, Swift, Kotlin, Flutter. Tool calling, auto RAG, NPU acceleration, INT4 quantization, hybrid cloud handoff.
2. **Cactus Graph**: PyTorch-like API for custom models. RAM-efficient, lossless weight quantization.
3. **Cactus Kernels**: ARM SIMD kernels for Apple, Snapdragon, Google, Exynos, MediaTek.

## Key Metrics

- 5x cost savings vs cloud
- <120ms latency on-device
- <6% WER transcription
- 1 unified API across platforms

## Supported Models (v1.7)

| Category | Models |
|----------|--------|
| LLM | Gemma-3, LiquidAI LFM2/LFM2.5, Qwen3 |
| Vision (VLM) | LFM2-VL, LFM2.5-VL |
| Transcription | Whisper Small/Medium, Moonshine-Base |
| VAD | Silero VAD |
| Embeddings | Nomic-Embed, Qwen3-Embedding |

## Performance Benchmarks (INT8)

### Flagship Devices

| Model | Mac M4 Pro | iPhone 17 Pro | Galaxy S25 Ultra |
|-------|------------|---------------|------------------|
| LFM2.5-1.2B | 582/77 tps (76MB) | 300/33 tps (108MB) | 226/36 tps (1.2GB) |
| LFM2.5-VL-1.6B | 0.2s/76tps (87MB) | 0.3s/33tps (156MB) | 2.6s/33tps (2GB) |
| Whisper-Small | 0.1s/119tps (73MB) | 0.3s/114tps (177MB) | 2.3s/90tps (363MB) |

### Mid-Range Devices

| Model | iPad/Mac M2 | Pixel 6a |
|-------|-------------|----------|
| LFM2-350m | 998/101 tps (334MB) | 218/44 tps (395MB) |
| LFM2-VL-450m | 0.2s/109tps (146MB) | 2.5s/36tps (631MB) |
| Moonshine-Base | 0.3s/395tps (201MB) | 1.5s/189tps (111MB) |

## SDK Installation

### React Native
```bash
npm install cactus-react-native react-native-nitro-modules
```

### CLI (macOS)
```bash
brew install cactus-compute/cactus/cactus
```

### Flutter/Kotlin
Clone repo → checkout v1.7 → `source ./setup` → `cactus build --flutter` or `--android`

## LLM API — React Native

```javascript
import { CactusLM } from 'cactus-react-native';

const cactusLM = new CactusLM();
await cactusLM.download();
await cactusLM.init();

const result = await cactusLM.complete({
  messages: [{ role: 'user', content: 'Hello!' }],
  onToken: (token) => console.log(token)
});
```

## Vision (VLM) — React Native

```javascript
const cactusLM = new CactusLM({ model: 'lfm2-vl-450m' });

await cactusLM.complete({
  messages: [{
    role: 'user',
    content: "What's in this image?",
    images: ['path/to/image.jpg']
  }]
});
```

## Transcription (STT) — React Native

```javascript
import { CactusSTT } from 'cactus-react-native';

const cactusSTT = new CactusSTT({ model: 'whisper-small' });
const result = await cactusSTT.transcribe({
  audio: 'path/to/audio.wav',
  onToken: (token) => console.log(token)
});
```

## Streaming Transcription

```javascript
await cactusSTT.streamTranscribeStart({
  confirmationThreshold: 0.99,
  minChunkSize: 32000
});
const result = await cactusSTT.streamTranscribeProcess({ audio: audioChunk });
console.log('Confirmed:', result.confirmed);
console.log('Pending:', result.pending);
const final = await cactusSTT.streamTranscribeStop();
```

## Cloud Handoff

```javascript
const result = await cactusLM.complete({
  messages: [{ role: 'user', content: 'Explain quantum entanglement' }]
});
if (result.cloudHandoff) {
  // Confidence too low → use cloud
}
```

Response when handoff: `{ "success": true, "cloud_handoff": true, "confidence": 0.42 }`

## Hybrid Cloud

- 80%+ of production inference handled on-device
- Real-time audio quality monitoring with seamless cloud/device switching
- Privacy mode: lock to on-device only (HIPAA, GDPR compliant)

## C++ API

```cpp
#include <cactus.h>
cactus_model_t model = cactus_init("path/to/weights");
char response[4096];
cactus_complete(model, messages, response, sizeof(response), nullptr, nullptr, callback);
```

## Hackathon Relevance

**Henry Ndubuaku が審査員。** Worker phone でオンデバイス VLM（LFM2-VL-450m）によるシーン記述は stretch goal。PWA（ブラウザ）からは直接 Cactus SDK を使えないため、React Native アプリが必要。4時間では厳しいが、アーキテクチャ図で名前を出すだけでも価値あり。

### PRDでの位置付け
- Tier C (Stretch): Cactus VLM でシーン記述
- 現実的には Tier B (HSV) + Claude API (cloud) で検証
- ピッチでは「on-device AI の将来ビジョン」として言及
