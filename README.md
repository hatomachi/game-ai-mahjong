# AI Mahjong Coach (麻雀ゲーム & AI牌読みコーチ) 🀄🤖

ブラウザ4人麻雀ゲーム（1プレイヤー vs 3CPU）と、Direct API（Google Gemini / Claude）およびローカルCLI（Antigravity CLI / Claude Code）を連携させた**「不完全情報AI牌読みコーチングシステム」**です。

Cloudflare Pages 等の静的ホスティングで簡単に公開でき、各自のAPIキー（BYOK）または完全オフラインのルールベース牌読みエンジンで誰でも遊べます。

---

## 🌟 特徴

1. **完全な不完全情報AIコーチ**:
   - AIは他家の手牌や山牌にアクセスできません。プレイヤーに見えている公開情報（自手牌、全員の捨て牌/河、副露、ドラ、点数、自風・場風）のみから、筋・壁・現物・向聴数などをロジカルに推論・解説します。
2. **マルチAIバックエンド対応（ハイブリッド）**:
   - **Google Gemini Direct API** (推奨): ブラウザから直接高速推論（1日1500回まで無料枠利用可能）
   - **Anthropic Claude Direct API**: ブラウザから直接高精度推論
   - **ローカルCLI (agy / claude)**: 開発時やCLIで深く推論させたい場合にローカル連携
   - **ルールベース牌読みエンジン**: APIキー未設定・オフラインでも完全0円・即座に応答
3. **Cloudflare Pages / 静的ホスティング完全対応**:
   - バックエンドサーバーなしの完全なSPAとしてビルド・デプロイ可能。

---

## 🚀 起動方法

### ローカル開発
```bash
# 依存関係のインストール
npm install

# フロントエンド & ローカルCLIサーバーの同時起動
npm run dev

# 個別起動
npm run dev:web      # フロントエンド (http://localhost:5173)
npm run dev:server   # ローカルCLIサーバー (http://localhost:3001)

# テスト実行
npm test
```

---

## ☁️ Cloudflare Pages へのデプロイ手順

1. 本リポジトリを GitHub に push します。
2. Cloudflare ダッシュボードで **Workers & Pages > Create application > Pages > Connect to Git** を選択。
3. ビルド設定を入力:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. （任意）友達全員に無料Gemini枠を提供する場合：
   - Pages プロジェクト設定の **Settings > Environment variables** に `GEMINI_API_KEY` を登録すると、Cloudflare Functions 経由で友達もキー入力不要でAIコーチが使えます。
5. **Save and Deploy** をクリックして完了！

---

## 📚 ドキュメント一覧
- [AGENTS.md](file:///Users/s-ikari/work/game-ai-mahjong/AGENTS.md) - セッション間引き継ぎ用総合開発ガイド
- [docs/ARCHITECTURE.md](file:///Users/s-ikari/work/game-ai-mahjong/docs/ARCHITECTURE.md) - システムアーキテクチャ設計書
- [docs/ROADMAP.md](file:///Users/s-ikari/work/game-ai-mahjong/docs/ROADMAP.md) - 段階的開発ロードマップ & タスク一覧
- [docs/DATA_MODELS.md](file:///Users/s-ikari/work/game-ai-mahjong/docs/DATA_MODELS.md) - 牌・局面・コンテキストの型仕様書
- [docs/AI_COACHING_SPEC.md](file:///Users/s-ikari/work/game-ai-mahjong/docs/AI_COACHING_SPEC.md) - 牌読み仕様 & CLI連携プロンプト設計書
