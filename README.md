# AI Mahjong Coach (麻雀ゲーム & AI牌読みコーチ) 🀄🤖

MacBookローカル環境で動作するブラウザ4人麻雀ゲーム（1プレイヤー vs 3CPU）と、ローカルCLI（Antigravity CLI / Claude Code等）を直接連携させた**「不完全情報AI牌読みコーチングシステム」**です。

---

## 🌟 特徴
1. **完全な不完全情報AIコーチ**:
   - AIはCPUの手牌や山牌にアクセスできません。プレイヤーに見えている公開情報（自手牌、全員の捨て牌/河、副露、ドラ、点数）のみから、筋・壁・現物・序盤打牌などをロジカルに分析します。
2. **ローカルCLI直接連携**:
   - MacBook上で動く `agy`（Antigravity CLI）や `claude -p`（Claude Code）をゲームエンジンから自動実行し、チャットで何でも質問できます。
3. **牌読み学習・上達のサポート**:
   - 「何を切るべきか」「誰がテンパイしているか」「危険牌・安牌の理由」「符計算・点数計算の根拠」などを論理的に解説。

---

## 🚀 クイックスタート

### 1. 依存関係のインストール
```bash
npm install
```

### 2. アプリケーションの起動
```bash
npm run dev
```
- フロントエンド: `http://localhost:5173`
- ローカルCLIブリッジサーバー: `http://localhost:3001`

### 3. テストの実行
```bash
npm test
```

---

## 📚 ドキュメント一覧
- [AGENTS.md](file:///Users/s-ikari/work/game-ai-mahjong/AGENTS.md) - セッション間引き継ぎ用総合開発ガイド
- [docs/ARCHITECTURE.md](file:///Users/s-ikari/work/game-ai-mahjong/docs/ARCHITECTURE.md) - システムアーキテクチャ設計書
- [docs/ROADMAP.md](file:///Users/s-ikari/work/game-ai-mahjong/docs/ROADMAP.md) - 段階的開発ロードマップ & タスク一覧
- [docs/DATA_MODELS.md](file:///Users/s-ikari/work/game-ai-mahjong/docs/DATA_MODELS.md) - 牌・局面・コンテキストの型仕様書
- [docs/AI_COACHING_SPEC.md](file:///Users/s-ikari/work/game-ai-mahjong/docs/AI_COACHING_SPEC.md) - 牌読み仕様 & CLI連携プロンプト設計書
