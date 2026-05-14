# CLAUDE.md — 声语大陆（Phonosia）
# Claude Code 项目主文档 · 唯一执行依据

> 每次开启新会话，将本文件完整内容作为上下文输入 Claude Code。
> 所有 Phase 按顺序执行，不得跳过。

---

## ▌项目一句话描述

儿童英语口语游戏 App。孩子大声说出英语单词，收服屏幕里对应的"语灵"生物。
纯语音交互，零键盘，以 KET 1000 词为骨架，图鉴即词表，集齐驱动复习。

---

## ▌技术栈总览

```
前端：React Native 0.74 (TypeScript)
  动画：Lottie（静态动效）+ React Native Skia（实时音量响应）+ Reanimated
  状态：Zustand + MMKV（持久化）
  网络：TanStack Query + Axios
  本地库：SQLite (react-native-sqlite-storage)
  导航：React Navigation v7
  列表：@shopify/flash-list

后端：Node.js 20 + Fastify 4 (TypeScript)
  ORM：Prisma + PostgreSQL 15
  缓存：Redis 7 + BullMQ
  验证：Zod
  日志：Pino

语音：Azure Pronunciation Assessment API（开发用 Mock 模式）
AI对话：Claude API claude-sonnet-4-20250514（Phase 9，AI 语灵伙伴）
TTS：Azure TTS en-US-AriaNeural（Phase 9）

部署：Docker Compose（本地）/ Kubernetes（生产）
```

---

## ▌设计约定（所有 Phase 共同遵守）

### 颜色
```
spiritPurple:  #5B4BE8   主色，声晶仪发光色
naturalGold:   #F0A832   闪光语灵、收服高光
landBeige:     #F5EFE0   大陆背景色
confused:      #F5A623   容错提示色（禁止用红色表示错误）
dark:          #1A1A2E   AI 伴侣界面背景
```

### 字体
```
英语单词显示：Nunito-Bold（32pt 基准，超8字符缩至24pt）
中文说明：系统字体（苹方/小米兰亭）
数字计分：Fredoka-One
```

### 交互铁律
1. 核心游戏流程零键盘——所有收服动作必须由语音触发
2. 失败反馈语言：「它还没听懂」而非「你说错了」
3. 语灵失败动画：侧耳倾听（好奇）→ 专注靠近 → 邀请示范，禁止叹气/耸肩/红色✗
4. 失败类型区分：只有 PRONUNCIATION_LOW 计入失败计数

### v2.0 核心补丁（所有 Phase 必须遵守）
```
1. 超时双层：UI 体感 3s / Azure 网络 8s，完全解耦
2. 失败计数：RECOGNITION_FAILED / SILENCE / TIMEOUT 不计入 consecutiveFailures
3. 声晶仪渲染：listening 状态用 Skia，其余用 Lottie
4. 图鉴：只显示当前解锁岛屿格子，未解锁用云雾遮罩
5. AI 语灵伙伴：收服 100 词解锁，受限词表 + Claude API + Azure TTS（Phase 9）
```

---

## ▌目录结构（完整工程）

```
phonosia/
├── CLAUDE.md
├── docker-compose.yml
├── .env.local
├── .gitignore
├── apps/
│   ├── mobile/
│   │   └── src/
│   │       ├── api/
│   │       ├── store/
│   │       ├── screens/
│   │       │   ├── Auth/
│   │       │   ├── Map/
│   │       │   ├── Battle/
│   │       │   ├── Grimoire/
│   │       │   ├── Companion/
│   │       │   └── Parent/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── navigation/
│   │       ├── theme/
│   │       ├── i18n/
│   │       └── utils/
│   └── backend/
│       └── src/
│           ├── config/
│           ├── db/
│           ├── modules/
│           │   ├── auth/
│           │   ├── spirits/
│           │   ├── progress/
│           │   ├── voice/
│           │   ├── companion/
│           │   └── report/
│           ├── middleware/
│           └── utils/
└── packages/
    └── shared/
```

---

## ▌环境变量（.env.local）

```env
DATABASE_URL=postgresql://phonosia:phonosia_dev@localhost:5432/phonosia_dev
REDIS_URL=redis://localhost:6379
AZURE_SPEECH_KEY=mock
AZURE_SPEECH_REGION=chinanorth2
AZURE_SPEECH_ENDPOINT=https://chinanorth2.stt.speech.azure.cn
AZURE_TTS_KEY=mock
ANTHROPIC_API_KEY=your_key_here
JWT_SECRET=phonosia_jwt_secret_dev_only
JWT_EXPIRES_IN=30d
APP_ENV=development
API_BASE_URL=http://localhost:3000
DAILY_NEW_WORDS_LIMIT=5
DAILY_REVIEW_WORDS_LIMIT=10
COMPANION_UNLOCK_THRESHOLD=100
COMPANION_DAILY_MINUTES=5
PARENT_PIN_SALT=phonosia_pin_salt_dev
```

---

# PHASE 0 — 环境初始化

## ⟹ 交给 Claude Code 的 Prompt

```
你正在构建"声语大陆（Phonosia）"儿童英语口语游戏 App。执行 Phase 0：工程初始化。

步骤 1：创建 Monorepo 根目录
  mkdir phonosia && cd phonosia
  mkdir -p apps packages/shared && git init

步骤 2：根目录 package.json
  { "name":"phonosia-monorepo", "private":true, "workspaces":["apps/*","packages/*"] }

步骤 3：初始化 React Native（TypeScript 模板）
  cd apps
  npx @react-native-community/cli@latest init Phonosia --template react-native-template-typescript --directory mobile
  cd mobile && npm install \
    @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs \
    react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated \
    zustand @tanstack/react-query axios react-native-mmkv \
    lottie-react-native @shopify/react-native-skia @shopify/flash-list \
    react-native-audio-recorder-player react-native-permissions react-native-sqlite-storage \
    i18next react-i18next react-native-haptic-feedback \
    @gorhom/bottom-sheet react-native-config @react-native-community/netinfo react-native-svg

步骤 4：初始化 Fastify 后端
  cd ../../apps && mkdir backend && cd backend && npm init -y
  npm install fastify @fastify/cors @fastify/jwt @fastify/helmet @fastify/rate-limit @fastify/multipart \
    @prisma/client prisma ioredis bullmq zod pino pino-pretty bcryptjs uuid axios
  npm install -D typescript @types/node ts-node tsx nodemon jest @types/jest ts-jest supertest @types/supertest

步骤 5：docker-compose.yml（根目录）
  version: '3.8'
  services:
    postgres:
      image: postgres:15-alpine
      environment: { POSTGRES_DB: phonosia_dev, POSTGRES_USER: phonosia, POSTGRES_PASSWORD: phonosia_dev }
      ports: ["5432:5432"]
      volumes: [postgres_data:/var/lib/postgresql/data]
    redis:
      image: redis:7-alpine
      ports: ["6379:6379"]
      command: redis-server --appendonly yes
      volumes: [redis_data:/data]
  volumes: { postgres_data: {}, redis_data: {} }

步骤 6：Prisma Schema（apps/backend/prisma/schema.prisma）
  创建包含以下5个 model 的 schema（datasource db: postgresql, env DATABASE_URL）：
  
  User: id(uuid), childName, ageGrade(SmallInt), parentPhone, parentPinHash, subscriptionTier(default:free), createdAt, updatedAt
  Spirit: id(Int), word, islandId(SmallInt), theme, difficulty(SmallInt), phonetic, meaningZh, exampleSentence, isBoss(Boolean)
  UserSpirit: @@id([userId,spiritId]), userId, spiritId, capturedAt, bestScore(SmallInt), captureVersion(default:standard), reviewCount(default:0), nextReviewAt, nickname
  DailySession: id(uuid), userId, sessionDate(Date), newWordsCount, reviewWordsCount, totalAttempts, totalSuccess, sessionDurationSeconds, createdAt — @@unique([userId,sessionDate])
  PronunciationLog: id(uuid), userId, spiritId, score(SmallInt), attemptNumber(SmallInt), audioDurationMs, failureReason(VarChar30 nullable), attemptCounted(Boolean default:true), createdAt

步骤 7：执行初始化
  docker-compose up -d
  cd apps/backend && npx prisma migrate dev --name init

验收：docker ps 显示两个容器，prisma studio 显示5张表，Metro bundler 启动无报错
```

---

# PHASE 1 — 后端核心服务

## ⟹ 交给 Claude Code 的 Prompt

```
声语大陆，Phase 0 已完成。实现后端核心模块。

任务 1：config/index.ts
  读取所有环境变量，必填项缺失时 process.exit(1)
  导出 config 对象（db, redis, jwt, azure, anthropic, app）

任务 2：index.ts 入口
  注册顺序：helmet → cors → rate-limit(100/min) → jwt → multipart(2MB) → 路由
  监听 3000 端口

任务 3：middleware/auth.ts
  preHandler：读取 Bearer token → jwt.verify() → 注入 request.userId
  失败返回 { code:'UNAUTHORIZED', message:'请先登录' }

任务 4：modules/auth/
  schema.ts（Zod）：
    RegisterInput: childName(1-50), ageGrade(1-6), parentPhone(11位手机号), parentPin(4-6位数字)
    LoginInput: parentPhone, parentPin
  
  service.ts：
    register: 检查手机号重复(409) → bcrypt.hash(pin,10) → 创建用户 → 返回JWT+用户信息
    login: 查用户 → bcrypt.compare → 返回JWT
    verifyParentPin: Redis记录失败次数，>=5次返回locked，成功清除计数
  
  routes.ts：
    POST /api/auth/register
    POST /api/auth/login
    POST /api/auth/verify-pin（需要JWT）

任务 5：间隔重复算法 utils/spacedRepetition.ts
  getNextReviewDate(score:number, reviewCount:number, lastIntervalDays:number): Date
  转换：score>=90→quality5, >=70→4, >=50→3, else→1
  quality<3 → interval=1
  reviewCount=0 → interval=1; =1 → interval=3
  else → interval=min(round(lastInterval*(1.3+(quality-3)*0.1)), 30)
  返回今天+interval天的Date对象（时间归零）

任务 6：prisma/seed.ts（写入20条测试语灵）
  岛01（islandId:1）：id1-9普通词 + id100 BOSS(home)
  岛02（islandId:2）：id101-109普通词 + id200 BOSS(restaurant)
  具体单词：apple/book/cat/dog/elephant/family/garden/house/kitchen/home
           banana/bread/cake/drink/egg/fish/juice/milk/orange/restaurant
  执行：npx tsx prisma/seed.ts

任务 7：modules/progress/
  service.ts：
    getDailyTask(userId): Redis缓存(key:daily_task:{userId}:{YYYY-MM-DD}，TTL到当日23:59:59)
      复习词：nextReviewAt<=今天的UserSpirit，取10条
      新词：未收服的Spirit，按islandId/difficulty排序，取5条
    
    captureSpirit(userId, spiritId, score, failureReason?, audioDurationMs?):
      【v2.0关键逻辑】
      failureReason=RECOGNITION_FAILED/SILENCE/TIMEOUT:
        写PronunciationLog(attemptCounted:false)，返回{captured:false, counted:false}
      score<70(PRONUNCIATION_LOW):
        写PronunciationLog(attemptCounted:true)，返回{captured:false, counted:true}
      score>=70:
        upsert UserSpirit(bestScore取max，captureVersion:score>=90?shiny:standard，shiny不降级)
        计算nextReviewAt(调用spacedRepetition)
        更新DailySession统计
        写PronunciationLog(attemptCounted:true)
        检查是否达到100只 → 如果是，返回{...result, companionUnlocked:true}
        返回{captured:true, version:'shiny'|'standard', isFirstCapture:boolean, counted:true}
  
  routes.ts（全需JWT）：
    GET /api/progress/daily-task
    POST /api/progress/capture  body:{spiritId, score, failureReason?, audioDurationMs}
    GET /api/progress/grimoire  返回UserSpirit+Spirit详情+unlockedIslands
    GET /api/progress/stats     返回totalCaptured/streakDays/islandProgress

验收：
  注册→登录→daily-task正常
  capture score:92 → {captured:true, version:'shiny'}
  capture failureReason:'RECOGNITION_FAILED' → {counted:false}
  capture score:50, failureReason:'PRONUNCIATION_LOW' → {counted:true}
```

---

# PHASE 2 — 语音评测代理

## ⟹ 交给 Claude Code 的 Prompt

```
声语大陆，Phase 1 已完成。实现语音评测服务。

任务 1：utils/failureTypes.ts
  导出类型：FailureReason = 'RECOGNITION_FAILED'|'PRONUNCIATION_LOW'|'TIMEOUT'|'SILENCE'
  导出接口：AssessmentResult { overallScore, accuracyScore, fluencyScore, recognizedText, isRecognized, failureReason?, wordDetails[] }

任务 2：utils/audioValidator.ts
  validateWavBuffer(buf: Buffer): { valid: boolean; error?: string }
  检查：文件大小<=2MB，长度>=44，bytes[0-3]='RIFF'，bytes[8-11]='WAVE'，采样率(bytes24-27小端序)=16000

任务 3：modules/voice/voice.service.ts
  
  Mock 模式（AZURE_SPEECH_KEY==='mock'）：
    mockAssess(referenceText): 延迟800ms，返回75-98随机分数的AssessmentResult
  
  真实模式：
    assessPronunciation(audioBuffer, referenceText):
      构建评测参数JSON并Base64编码：{ReferenceText, GradingSystem:"HundredMark", Granularity:"Word", Dimension:"Comprehensive", EnableProsodyAssessment:"False"}
      axios.post到Azure endpoint，timeout:8000
      解析RecognitionStatus：
        非Success → InitialSilenceTimeout?SILENCE:RECOGNITION_FAILED
        PronScore<70 → PRONUNCIATION_LOW
      网络异常 → TIMEOUT

任务 4：modules/voice/voice.routes.ts
  POST /api/voice/assess（需要JWT）
  接收multipart: audio(WAV), referenceText(string), spiritId(number)
  流程：validateWavBuffer → assessPronunciation/mockAssess → progress.captureSpirit → 返回合并结果
  返回：{ score, accuracyScore, fluencyScore, isRecognized, failureReason, captured, captureVersion, counted, wordDetails[] }

验收：
  Mock模式 POST /api/voice/assess(WAV+apple+spiritId:1) → 返回score字段
  非WAV → 400
  >2MB → 400
  score>=90时captureVersion='shiny'，counted:true
  failureReason:RECOGNITION_FAILED时counted:false
```

---

# PHASE 3 — 前端基础框架

## ⟹ 交给 Claude Code 的 Prompt

```
声语大陆，后端已完成。搭建React Native前端基础框架。

任务 1：theme/colors.ts
  按设计约定实现完整色彩系统（spiritPurple/naturalGold/landBeige/confused/dark/island[1-10]/text/surface/border）

任务 2：theme/typography.ts & spacing.ts
  wordDisplay:{fontFamily:'Nunito-Bold',fontSize:32,letterSpacing:1.5}
  wordMedium:{fontFamily:'Nunito-Bold',fontSize:24}
  score:{fontFamily:'Fredoka-One',fontSize:48}
  bodyZh:{fontSize:14,lineHeight:22}
  spacing:{xs:4,sm:8,md:16,lg:24,xl:32,xxl:48}
  radius:{sm:8,md:12,lg:16,xl:24,full:9999}

任务 3：api/client.ts
  Axios实例，baseURL来自react-native-config
  请求拦截：注入Bearer token（从authStore读取）
  响应拦截：401时清除auth状态

任务 4：api/auth.api.ts, progress.api.ts, voice.api.ts
  封装所有后端接口，完整TypeScript类型定义
  voice.api.ts的assessVoice：接受{audioPath,referenceText,spiritId}，内部构建FormData

任务 5：store/authStore.ts（Zustand+MMKV持久化）
  字段：token/userId/childName/ageGrade/subscriptionTier
  方法：setAuth/clearAuth
  MMKV持久化token和userId（同步读写）

任务 6：store/gameStore.ts（Zustand）
  字段：todayQueue(Spirit[])/currentIndex/battlePhase/lastResult/consecutiveFailures/networkHint
  battlePhase类型：'entering'|'waiting'|'recording'|'assessing'|'result'|'celebrating'|'completed'
  方法：setQueue/advance/setPhase/setResult/incrementFailures(仅PRONUNCIATION_LOW时调用)/resetFailures/setNetworkHint

任务 7：hooks/useVoiceRecorder.ts【v2.0双层超时核心】
  常量：CHILD_UX_TIMEOUT_MS=3000, AZURE_NETWORK_TIMEOUT_MS=8000
  
  stopAndAssess(referenceText, spiritId):
    停录音获取路径
    启动3s计时器：到时setNetworkHint(true)+setPhase('waiting')，不计失败
    发起网络请求（最长8s）
    收到结果：clearTimeout → 若networkHint已触发则丢弃结果
    正常处理结果：result.counted===true时incrementFailures，captured时resetFailures
  
  同时维护：isRecording(boolean)/volume(0-1实时音量)

任务 8：navigation/RootNavigator.tsx
  Stack Root:
    AuthStack（isLoggedIn=false）：Welcome/Register/Login
    AppTab（isLoggedIn=true）：
      Tab WorldMap（🗺️图标）
      Tab Battle（中央，spiritPurple圆形64pt悬浮按钮）
      Tab Grimoire（📖图标）
  Tab Bar：surface白色背景，Battle按钮绝对定位居中悬浮

验收：
  模拟器启动显示WelcomeScreen不崩溃
  注册→登录→进入Tab导航
  重启App仍保持登录（MMKV持久化）
  每条请求自动携带Bearer token
```

---

# PHASE 4 — 核心战斗界面

## ⟹ 交给 Claude Code 的 Prompt

```
声语大陆，前端基础已就绪。实现BattleScreen（产品核心）。

遵守v2.0：
- 声晶仪listening状态用Skia，其余用Lottie占位
- 失败动画：侧耳倾听（好奇）→专注靠近→邀请示范
- 超时3s不计失败

任务 1：components/SoundCrystal.tsx
  Props: { state:'idle'|'listening'|'assessing'|'success'|'confused'|'network_retry', volume:number(0-1), onPress:()=>void }
  
  idle：Lottie占位(assets/animations/crystal_idle.json，用纯色圆形暂代) + 脉冲动画(scale 1.0→1.1，2s sine) + "大声说出它的名字！"
  
  listening：React Native Skia实现
    Canvas 200×200
    三层声波环：scale 0.8→1.6，opacity 0.8→0，周期1.2s，相位差0.4s
    中心晶体：radius=36+volume*20，BlurMask blur=8+volume*12，color:spiritPurple
    粒子：floor(volume*12)个小圆点，向中心方向动画
    提示文字："说吧！"
  
  assessing：Reanimated旋转弧线Loading(spiritPurple) + "语灵在聆听..."
  
  success：✓图标(naturalGold) + 20个金色粒子向外扩散 + "它听懂啦！"
  
  confused（PRONUNCIATION_LOW，根据consecutiveFailures）：
    第1次：?图标(#F5A623) + 轻抖 + "再说一次？"
    第2次：耳朵图标 + "大声一点！"
    第3次：手势图标 + "看我怎么说～"
  
  network_retry（RECOGNITION_FAILED/TIMEOUT/SILENCE）：
    耳朵图标(softBlue) + 父组件传入提示文字

任务 2：components/SpiritDisplay.tsx
  Props: { spirit:Spirit, phase:BattlePhase, failureCount:number }
  
  进场动画（phase='entering'）：
    y:-200→0，scale:0.3→1.0
    spring(mass:0.8,stiffness:120,damping:14)
    单词标签delay 200ms淡入
  
  单词标签：Nunito-Bold，32pt，白色+阴影，>8字符缩至24pt
  
  失败动画（根据failureCount，仅PRONUNCIATION_LOW计数）：
    1次：整体rotate 15deg，对话气泡"Hmm？"（上扬），800ms后恢复
    2次：scale→1.15（靠近效果），耳朵emoji气泡，保持放大
    >=3次：翻掌向上手势，触发父组件显示引导弹层
  
  收服动画：
    standard：蓝紫光晕→语灵点头→向右上角飞出(scale 0.3，目标图鉴Tab图标位置)
    shiny：全屏白色闪光500ms + 金色光晕 + 语灵变金色 → 飞出

任务 3：components/PronunciationGuide.tsx（底部Modal）
  布局：语灵头像 | "听我说一次：" | ▶ 播放按钮 + word + 音标 | 嘴型占位动画 | [再试一次] [跳过这个词]
  播放：AudioRecorderPlayer.startPlayer(范读URL)
  再试一次：关闭Modal + 重置failureCount + 设phase='waiting'
  跳过：gameStore.advance() + 标记需加强

任务 4：screens/Battle/BattleScreen.tsx
  布局（从上到下）：
    10%：今日进度条（新词X/5 · 复习X/10）
    55%：SpiritDisplay
    5%：音标+中文释义（收服后显示2s）
    30%：SoundCrystal
  
  状态机流程：
    mount → loadDailyTask() → setPhase('entering')
    进场动画1.2s结束 → setPhase('waiting')
    waiting → 点击声晶仪 → 请求麦克风权限 → startRecording() → setPhase('recording')
    2.5s静音检测/音量骤降 → setPhase('assessing') → stopAndAssess()
    
    结果处理：
      captured:true → setPhase('celebrating') → 标准1s/闪光1.5s动画 → 显示音标释义1.5s → advance()
      counted:true(PRONUNCIATION_LOW) → setPhase('waiting')，等待再录音
      counted:false → setPhase('waiting')，显示网络提示（不计失败）
      consecutiveFailures>=3 → 显示PronunciationGuide
    
    队列结束 → setPhase('completed') → 显示今日完成庆祝页

任务 5：今日完成庆祝页
  全屏覆盖：🎉今日冒险完成！
  今日收服语灵列表（头像排列，闪光标记）
  统计：新词X只·复习X只·连续打卡X天
  [去图鉴看看] → 跳转GrimoireScreen

验收：
  进入BattleScreen语灵飞入不崩溃
  点击声晶仪开始录音，Skia音波响应音量
  Mock score:92 → 全屏白色闪光+金粒子
  Mock score:75 → 蓝紫光晕
  Mock score:50(PRONUNCIATION_LOW) → 语灵侧耳，第3次触发引导弹层
  RECOGNITION_FAILED → 耳朵手势，网络提示，不计失败数
  5只新词完成 → 今日完成庆祝页
```

---

# PHASE 5 — 图鉴界面

## ⟹ 交给 Claude Code 的 Prompt

```
声语大陆，实现GrimoireScreen。遵守v2.0：只显示已解锁岛屿，未解锁云雾遮罩。

任务 1：解锁逻辑
  从/api/progress/stats获取islandProgress
  解锁条件：当前岛captured>=80解锁下一岛
  MVP默认解锁岛01和岛02

任务 2：GrimoireScreen主界面
  顶部：已解锁岛屿横向Tab（不显示未解锁）
  进度文字："已收服 XX 只 · 声语大陆还有更多秘密等你发现"（不显示总量1000）
  
  FlashList：numColumns:5，estimatedItemSize:(screenWidth-32)/5
  数据：当前选中岛屿的Spirit列表（从localDB或API获取）

任务 3：格子三状态组件
  locked：岛屿色低透明度(0.3)背景 + 灰色剪影占位 + "?"中心
    点击：播放范读音频，不显示释义
  standard：岛屿色背景 + 语灵图占位（色块） + 无标记
  shiny：金色渐变边框(2pt) + ★右下角

任务 4：云雾区域
  FlashList底部追加一个FogCard：
    云雾纹理背景（用模糊渐变色块占位）
    "完成当前岛屿80只后，探索下一片大陆"
    不可点击

任务 5：详情底部弹层（@gorhom/bottom-sheet，snapPoints:['45%']）
  已收服：语灵大图 | ▶播放 | word(28pt) | 音标 | 中文释义 | 例句 | 收服日期 | 昵称[编辑] | 版本标签
  未收服：灰色剪影 | ▶播放 | [去遇见它]→跳转Battle

任务 6：今日进度横幅（GrimoireScreen顶部）
  "今日新词 X/5 · 复习 X/10 · 完成显示✅今日已完成"

验收：
  FlashList滚动流畅
  已收服格子彩色，闪光版金色边框
  未收服点击播放范读
  详情弹层完整
  岛Tab切换正常
  未解锁岛显示云雾
```

---

# PHASE 6 — 世界地图与家长报告

## ⟹ 交给 Claude Code 的 Prompt

```
声语大陆，实现WorldMapScreen和ParentReportScreen。

任务 1：WorldMapScreen
  背景：landBeige #F5EFE0
  10个岛屿图标，3-4-3行布局，各56pt圆形
  解锁：岛屿主题色 + 岛名 + "X/100"
  锁定：灰色 + 🔒，不可点击
  
  今日任务卡片（居中，F5F5FF背景，圆角16，阴影）：
    待完成："🎮今日冒险" + "剩余X只语灵等待你！" + [开始冒险]大按钮(spiritPurple,高52pt,圆角26)
    已完成："✅今日冒险完成！" + "收服了X只新语灵" + "明天见！"
  
  右上角齿轮图标 → 家长入口（tap区域44pt）

任务 2：家长PIN弹层（Modal全屏，不使用系统键盘）
  标题："[孩子名字]的学习报告"
  自定义数字键盘（0-9九宫格+退格，按键72×56pt）
  已输入位显示●，4位自动提交
  验证失败：Modal震动 + "还可以尝试X次"
  锁定："已锁定，X分钟后再试"
  成功：push ParentReportScreen

任务 3：后端报告接口（apps/backend/src/modules/report/）
  GET /api/report/daily（需JWT）：新词数/复习数/学习时长/平均发音分/连续打卡天数
  GET /api/report/weekly（需JWT）：最近7天[{date,newWords,reviewWords,avgScore,durationMinutes}]
  GET /api/report/weak-words（需JWT）：连续3次PRONUNCIATION_LOW的词汇+Spirit详情

任务 4：ParentReportScreen（需先验证PIN）
  使用react-native-svg实现图表
  布局：
    ①今日数据4格卡片（新词/复习/时长/平均分）
    ②7天折线图（横轴日期，纵轴新词数）
    ③需加强词汇列表（红点标记+单词+音标）
    ④各岛屿进度条
    ⑤说明："发音≥90=⭐闪光版，70-89=普通版"

验收：
  地图显示，锁定/解锁状态正确
  今日任务卡片数量准确
  PIN弹层5次失败后锁定
  家长报告数据正确加载
  折线图正常渲染
```

---

# PHASE 7 — 离线策略

## ⟹ 交给 Claude Code 的 Prompt

```
声语大陆，实现离线优先策略。

任务 1：utils/localDatabase.ts（SQLite）
  建表（App首次启动执行）：
    spirits(id INTEGER PK, word, island_id, phonetic, meaning_zh, example_sentence, is_boss, difficulty)
    local_progress(spirit_id INTEGER PK, best_score, capture_version, review_count, next_review_at INTEGER, synced INTEGER DEFAULT 0)
  
  导出方法：
    getSpirits(islandId?): Promise<Spirit[]>
    upsertProgress(spiritId, score, version, nextReviewAt): Promise<void>
    getPendingSync(): Promise<LocalProgress[]>
    markSynced(spiritId): Promise<void>

任务 2：utils/syncManager.ts（单例）
  initialize():
    createTablesIfNeeded()
    downloadSpiritsIfNeeded() → 从/api/spirits下载词库到SQLite（词库不存在时执行）
    syncPendingProgress() → 上传synced=0的记录
    fetchLatestProgress() → 拉取云端UserSpirit到local_progress
  
  onNetworkRestore(): syncPendingProgress() + fetchLatestProgress()
  
  captureSpirit(spiritId, score, version, nextReviewAt):
    先写localDatabase.upsertProgress()
    尝试同步API，成功后markSynced，失败保留synced=0

任务 3：MMKV今日任务缓存（store/gameStore.ts扩展）
  key: daily_task_{userId}_{YYYYMMDD}
  跨天自动失效（比较key中的日期）

任务 4：NetInfo监听（src/App.tsx）
  NetInfo.addEventListener → isConnected时调用syncManager.onNetworkRestore()

任务 5：离线横幅（BattleScreen顶部）
  网络断开时显示："当前离线，发音暂不计分，联网后自动同步"
  背景#FFF9E6柔和黄，高度32pt

验收：
  关闭后端，App仍显示今日任务（MMKV缓存）
  离线收服→重新联网→自动同步
  SQLite中有词库数据
  断网横幅正确显示/隐藏
```

---

# PHASE 8 — 测试与打包

## ⟹ 交给 Claude Code 的 Prompt

```
声语大陆，实现测试覆盖和打包配置。

任务 1：后端测试（apps/backend/src/__tests__/）
  auth.test.ts（7条）：
    注册成功返回token / 手机号重复409 / 格式错误400
    登录正确密码返回token / 错误密码401
    verifyPin正确返回success:true / 5次失败返回locked:true

  progress.test.ts（8条）：
    daily-task返回5新词
    capture score:92→{captured:true,version:'shiny'}
    capture score:75→{captured:true,version:'standard'}
    先92后75→version保持shiny（不降级）
    failureReason:PRONUNCIATION_LOW→{counted:true}
    failureReason:RECOGNITION_FAILED→{counted:false}
    failureReason:SILENCE→{counted:false}
    grimoire返回userSpirits数组

  voice.test.ts（4条）：
    WAV文件→返回score字段
    非WAV→400 / >2MB→400
    返回结构含captured/counted/captureVersion

任务 2：iOS配置
  Info.plist添加：NSMicrophoneUsageDescription="声语大陆需要麦克风权限，用于识别你说出的英语单词，帮你收服语灵。"
  Podfile：platform :ios, '15.0'
  Bundle ID：com.phonosia.app，Display Name：声语大陆

任务 3：Android配置
  AndroidManifest.xml：RECORD_AUDIO + INTERNET权限
  build.gradle：applicationId:com.phonosia.app，minSdkVersion:24，targetSdkVersion:34，version:1.0.0

任务 4：环境变量（react-native-config）
  apps/mobile/.env（development）
  apps/mobile/.env.staging
  apps/mobile/.env.production

任务 5：后端Dockerfile
  FROM node:20-alpine → WORKDIR /app → npm ci --only=production → COPY dist/+prisma/ → EXPOSE 3000 → CMD node dist/index.js

任务 6：CI（.github/workflows/ci.yml）
  backend-test：node20，npm ci，npm test
  type-check：cd apps/mobile，npx tsc --noEmit

验收：
  npm test后端19条全通过
  iOS模拟器build成功
  Android模拟器build成功
  Dockerfile build成功
```

---

# PHASE 9 — AI 语灵伙伴

## ⟹ 交给 Claude Code 的 Prompt

```
声语大陆，实现AI语灵伙伴功能（Pro专属，收服100词解锁）。

任务 1：后端companion模块（src/modules/companion/）

service.ts：
  getVocabularyList(userId): 查UserSpirit→Spirit.word，Redis缓存1小时
  
  checkDailyLimit(userId): Redis记录当日使用秒数，限制=companionDailyMinutes*60
    返回{allowed:boolean, remainingMinutes:number}
  
  chat(userId, userMessage, history):
    获取词汇表
    构建System Prompt（注入词汇表，限制15词以内回复，只用词表内单词）
    调用Claude API claude-sonnet-4-20250514，max_tokens:60
    Mock模式（AZURE_TTS_KEY==='mock'）：audioBuffer=Buffer.alloc(0)
    真实模式：调用Azure TTS合成音频(en-US-AriaNeural)
    返回{text:string, audioBuffer:Buffer}

routes.ts：
  GET /api/companion/status（需JWT）：{unlocked:boolean, capturedCount:number, requiredCount:100, remainingMinutes:number}
  POST /api/companion/chat（需JWT）：
    验证unlocked，验证每日时长
    body:{message:string, history:Message[]}
    返回{text:string, audioBase64?:string}
    更新Redis使用时长

任务 2：解锁触发（已在Phase 1 captureSpirit中实现）
  当totalCaptured===100时返回companionUnlocked:true
  前端收到后触发解锁动画

任务 3：前端CompanionScreen（src/screens/Companion/）

界面：
  全屏深色背景#1A1A2E
  中央：守护语灵200pt占位图（idle/talking两种Lottie状态）
  对话历史：FlatList inverted，最近6条
    孩子说：右侧spiritPurple气泡
    语灵说：左侧#2A2A4E气泡+语灵头像
  底部：声晶仪（点击录音→识别文字→发送）
  顶部右："今天还有X分钟"

首次对话（自动）：语灵说 "*waves at you* Hello! I am [SpiritName]!"

时长到达：语灵说"See you tomorrow!"，播放TTS，自动退出

任务 4：解锁彩蛋（BattleScreen中）
  收服动画结束后若companionUnlocked:true：
    额外播放特殊动画，守护语灵飞出图鉴
    弹出提示："你的守护语灵解锁了！去地图找找它～"
  WorldMapScreen右下角出现守护语灵悬浮图标（Animated弹跳）

任务 5：导航更新
  AppTab新增：Companion页（仅unlocked时显示Tab，否则隐藏）
  或：从WorldMapScreen悬浮图标进入，不占Tab位置（推荐）

验收：
  /companion/status capturedCount<100返回unlocked:false
  Post /companion/chat返回text字段（Mock模式无音频）
  AI回复只用词表内单词（手动验5条）
  5分钟后remainingMinutes=0，接口返回403
  解锁动画在第100只收服后触发
```

---

# ▌全局验收清单（MVP 上线门槛）

```
核心功能
[ ] 语音收服完整流程（录音→评分→动效→图鉴更新）
[ ] 三种失败类型处理正确（PRONUNCIATION_LOW计失败/其他不计）
[ ] 超时3s体感层触发，不计失败
[ ] 连续3次PRONUNCIATION_LOW触发发音引导
[ ] 图鉴迷雾：只显示已解锁岛屿，未解锁云雾遮罩
[ ] 闪光版单向升级（standard→shiny不降级）
[ ] 今日配额完成后关闭新词入口
[ ] 家长PIN 5次错误锁定5分钟
[ ] 离线不崩溃，联网后自动同步

性能
[ ] 发音到反馈P95≤1.5s（Mock模式≤1s）
[ ] 图鉴FlashList滚动60fps
[ ] App冷启动≤3s

儿童测试（真实孩子3名以上）
[ ] 5人中4人无引导下完成第一次收服
[ ] 失败动画不引起沮丧情绪
[ ] 连续15分钟后自然停止
```

---

# ▌设计资产准备路径（无需 Figma）

```
Step 1：Claude Code先跑通所有界面（色块占位）
  所有颜色/字体/布局已在本文档定义，直接实现

Step 2：语灵角色（用即梦/Jimeng生成）
  每个单词输入提示词：
  "[word] spirit creature, cute magical beast, shape matches word meaning,
  chibi style, soft pastel colors, transparent background, game asset, 2D"
  输出PNG→导入Rive做idle/talking/capture动效

Step 3：声晶仪动画
  idle/success/confused：LottieFiles在线编辑器（免费），导出.json
  listening：已在Phase 4用Skia代码实现，无需设计稿

Step 4：迭代方式
  Claude Code生成界面→模拟器看效果→修改描述→再生成
  全程不需要Figma
```

---

# ▌API 完整清单

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | /api/auth/register | 无 | 注册 |
| POST | /api/auth/login | 无 | 登录 |
| POST | /api/auth/verify-pin | JWT | 验证家长PIN |
| GET | /api/progress/daily-task | JWT | 今日任务队列 |
| POST | /api/progress/capture | JWT | 收服语灵 |
| GET | /api/progress/grimoire | JWT | 图鉴全量数据 |
| GET | /api/progress/stats | JWT | 统计数据 |
| POST | /api/voice/assess | JWT | 上传音频评测 |
| GET | /api/report/daily | JWT | 今日报告 |
| GET | /api/report/weekly | JWT | 本周报告 |
| GET | /api/report/weak-words | JWT | 需加强词汇 |
| GET | /api/companion/status | JWT | AI伴侣解锁状态 |
| POST | /api/companion/chat | JWT | AI伴侣对话 |

---

# ▌常见问题排查

```
iOS字体报错 → npx react-native-asset && pod install && rebuild
Android录音权限 → 检查Manifest声明 + 运行时权限请求
Azure 401 → 检查KEY和REGION是否匹配，chinanorth2需用对应endpoint
Prisma连接失败 → docker ps确认postgres容器运行
FlashList卡顿 → 确认estimatedItemSize正确，图片使用缓存
录音上传超时 → 检查multipart 2MB限制，后端timeout配置
```

---

*CLAUDE.md v2.0 · 2026-05-13 · 整合PRD v1.0+v2.0补丁+所有Phase · 唯一执行依据*
