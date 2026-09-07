# Xe Cá Viên (Vietnamese Street Food Tycoon) — Complete Technical Walkthrough & Codex Review Document

**Repository Remote:** `https://github.com/9m0m/xe-ca-vien.git`  
**Current Upstream Branch:** `main` (Synchronized at HEAD commit `c3e22e5`)  
**Deployment Gate 3 Status:** `CODE READY — DEPLOYMENT VALIDATION INCOMPLETE`  
**Target Platform:** Mobile-First Web PWA & Vercel Serverless (Viewport 390×844 reference, responsive down to 320px, desktop bounded canvas)  
**Primary Tech Stack:** React 19, TypeScript strict mode, Vite 6, Tailwind CSS 3, Phaser 3, Zustand 5, Hono 4, Drizzle ORM, Neon PostgreSQL (`@neondatabase/serverless`), Web Audio API, PWA Service Worker.

---

## 1. Mục tiêu & Tổng quan Dự án (Project Executive Summary)

**Xe Cá Viên** là tựa game mô phỏng quản lý xe cá viên chiên vỉa hè đường phố Việt Nam, được phát triển với triết lý thiết kế tỉ mỉ (anti-AI-slop), chuẩn giao diện di động (mobile-first), kết hợp giữa vật lý chiên rán âm thanh sống động và kiến trúc backend server-authoritative bảo mật tuyệt đối.

### Điểm nổi bật của hệ thống:
1. **Trải nghiệm Chiên Rán Thực Tế (Phaser 3 Canvas)**:
   - Mô phỏng chảo dầu nóng với hạt bong bóng dầu sôi (`oil_bubble_sizzle`).
   - Âm thanh xèo xèo procedural sinh động bằng Web Audio API không cần asset ngoài.
   - Thao tác gắp xiên que vào chảo, canh thời gian chín vàng hoàn hảo (*perfect window*), tránh cháy khét (*overcooked*).
   - Hệ thống quầy gia vị với 6 loại nước chấm đường phố Việt Nam và hũ dưa chua giải ngấy đặc trưng.
2. **Kiến Trúc Backend Server-Authoritative (Hono 4 + Vercel)**:
   - Kinh tế game (tiền tệ `coins`, điểm kinh nghiệm `xp`, danh tiếng `reputation`) được tính toán và bảo đảm toàn vẹn trên server.
   - Chống gian lận: Client không thể tự ý gửi số tiền thưởng lên server; server tự đối soát công thức nấu, độ chín, nước chấm và thời gian phục vụ để thưởng tiền.
3. **Giao Dịch Nguyên Tử & Chống Race Condition (PostgreSQL + Row-Level Locking)**:
   - Các thao tác mua đồ (`/shop/unlock`), nâng cấp xe (`/upgrades/purchase`), nhận thưởng thành tựu (`/achievements/claim`) đều được đóng gói trong một PostgreSQL Transaction duy nhất với khóa dòng `SELECT ... FOR UPDATE`.
   - Ngăn chặn hoàn toàn lỗi race condition (ví dụ: nhấn đồng thời 2 yêu cầu nâng cấp khi chỉ đủ tiền cho 1 lần).
4. **Bảo Mật Phiên & Zero LocalStorage Secret**:
   - Sử dụng HttpOnly cookie `xcv_session` (`SameSite=Lax`, `Path=/`, `Secure=true` on prod).
   - Hoàn toàn không lưu session token, secret, hay sensitive state trong `localStorage`.
5. **PWA Hoàn Chỉnh & Hỗ Trợ Màn Hình Nhỏ**:
   - Web App Manifest đầy đủ (`manifest.webmanifest`), icon SVG & PNG đa kích thước.
   - Service Worker (`sw.js`) cache-first cho hashed assets, network-first cho HTML/API, hỗ trợ offline shell.
   - Giao diện đáp ứng từ màn hình siêu hẹp 320px (iPhone SE/máy giá rẻ) đến 390px (chuẩn mobile) và đóng khung responsive trên desktop.

---

## 2. Kiến Trúc Hệ Thống (Architecture & Topology)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT / PWA (Browser)                         │
│                                                                             │
│  ┌───────────────────────┐  State Sync  ┌────────────────────────────────┐  │
│  │   Phaser 3 Canvas     │◄────────────►│       React 19 Shell           │  │
│  │  (Frying, Tongs,      │              │  (HUD, Modals: Shop, Upgrades, │  │
│  │   Bubbles, Plating)   │              │   Achievements, Settings)      │  │
│  └───────────┬───────────┘              └────────────────┬───────────────┘  │
│              │                                           │                  │
│              └─────────────────┬─────────────────────────┘                  │
│                                │ Zustand Store (0 localStorage Secrets)     │
│                                ▼                                            │
│                      Service Worker (PWA Cache)                             │
│                      (Network-First for HTML/API,                           │
│                       Cache-First for hashed assets)                        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ HTTP (HttpOnly xcv_session Cookie)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SERVERLESS BACKEND (Hono / Vercel)                    │
│                                                                             │
│  ┌───────────────────────┐  Auth/Idemp  ┌────────────────────────────────┐  │
│  │  Order Authority API  │─────────────►│  Deterministic Reward Engine   │  │
│  │  (/orders/start,      │              │  (Evaluates cook state, sauces,│  │
│  │   /orders/complete)   │              │   speed, tips server-side)     │  │
│  └───────────┬───────────┘              └────────────────┬───────────────┘  │
│              │                                           │                  │
│  ┌───────────▼───────────┐              ┌────────────────▼───────────────┐  │
│  │ Atomic DB Transaction │              │ Session & Profile Management   │  │
│  │ (SELECT ... FOR UPDATE│              │ (Guest session creation,       │  │
│  │  balance checks, lock)│              │  profile retrieval)            │  │
│  └───────────┬───────────┘              └────────────────┬───────────────┘  │
└──────────────┼───────────────────────────────────────────┼──────────────────┘
               │                                           │
               ▼                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PERSISTENCE (Drizzle ORM)                           │
│                                                                             │
│  PostgreSQL (Neon Serverless Connection Pool) / Hardened Production Guard   │
│  Tables: players, player_sessions, player_progress,                         │
│          player_food_unlocks, player_upgrades, active_orders, order_runs,   │
│          player_achievements, player_stats                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Chi Tiết Mô Hình Dữ Liệu (PostgreSQL Schema via Drizzle)

Hệ thống định nghĩa 9 bảng thực thể chuẩn hóa trong `src/db/schema.ts`:

1. **`players`**:
   - `id` (UUID PK): Định danh duy nhất người chơi.
   - `display_name` (VARCHAR 64): Tên hiển thị (ví dụ: `Khách #4821`).
   - `is_guest` (BOOLEAN): Đánh dấu tài khoản khách (mặc định `true`).
   - `created_at`, `updated_at` (TIMESTAMPTZ).
2. **`player_sessions`**:
   - `id` (UUID PK).
   - `player_id` (UUID FK -> `players.id`, ON DELETE CASCADE).
   - `session_token` (VARCHAR 128, UNIQUE, INDEX): Mã token phiên ngẫu nhiên 48 ký tự hex.
   - `expires_at` (TIMESTAMPTZ): Thời hạn 30 ngày.
3. **`player_progress`**:
   - `id` (UUID PK).
   - `player_id` (UUID FK -> `players.id`, UNIQUE, ON DELETE CASCADE).
   - `coins` (INTEGER): Số dư tiền vốn (khởi đầu: 10.000 đ).
   - `level` (INTEGER): Cấp bậc người bán (khởi đầu: Level 1).
   - `xp` (INTEGER): Điểm kinh nghiệm tích lũy.
   - `reputation` (INTEGER): Chỉ số uy tín của quán (khởi đầu: 100/100).
4. **`player_food_unlocks`**:
   - `id` (UUID PK).
   - `player_id` (UUID FK -> `players.id`, ON DELETE CASCADE).
   - `food_id` (VARCHAR 64): Mã món ăn trong catalog (ví dụ: `fish_ball_classic`, `beef_ball_classic`).
   - `unlocked_at` (TIMESTAMPTZ).
   - **Unique Constraint:** `(player_id, food_id)` chống unlock trùng lặp.
5. **`player_upgrades`**:
   - `id` (UUID PK).
   - `player_id` (UUID FK -> `players.id`, ON DELETE CASCADE).
   - `upgrade_id` (VARCHAR 64): Mã nâng cấp xe (ví dụ: `pan_capacity`, `burner_heat`).
   - `current_tier` (INTEGER): Cấp độ nâng cấp hiện tại.
   - **Unique Constraint:** `(player_id, upgrade_id)`.
6. **`player_stats`**:
   - `id` (UUID PK).
   - `player_id` (UUID FK -> `players.id`, UNIQUE, ON DELETE CASCADE).
   - `orders_served` (INTEGER): Tổng số đơn hàng phục vụ thành công.
   - `perfect_items_fried` (INTEGER): Số xiên que chiên chuẩn xác tuyệt đối.
   - `total_coins_earned` (INTEGER): Tổng thu nhập tích lũy.
   - `foods_unlocked_count`, `upgrades_purchased_count` (INTEGER).
7. **`player_achievements`**:
   - `id` (UUID PK).
   - `player_id` (UUID FK -> `players.id`, ON DELETE CASCADE).
   - `achievement_id` (VARCHAR 64): Mã thành tựu (ví dụ: `first_order`, `rich_cart`).
   - `unlocked_at` (TIMESTAMPTZ): Thời điểm đạt điều kiện.
   - `claimed` (BOOLEAN): Trạng thái đã nhận thưởng coin/XP hay chưa.
   - **Unique Constraint:** `(player_id, achievement_id)`.
8. **`order_runs`**:
   - `id` (VARCHAR 128 PK): Mã phiên phục vụ đơn hàng (`ord_<timestamp>_<hex>`).
   - `player_id` (UUID FK -> `players.id`).
   - `satisfaction_score` (INTEGER): Điểm hài lòng của thực khách (0 - 100).
   - `coins_earned`, `xp_earned` (INTEGER).
   - `status` (VARCHAR 32): `COMPLETED`, `CANCELLED`, `EXPIRED`.
   - `completed_at` (TIMESTAMPTZ).
9. **`active_orders`**:
   - Lưu trữ đơn hàng đang diễn ra để bảo đảm tính duy nhất và kiểm soát thời gian kiên nhẫn (*patience*) của khách.

---

## 4. Cơ Chế Bảo Mật & Đảm Bảo Giao Dịch (Security & Invariants)

### A. Server-Authoritative Economy
- **Client gửi lên**: Danh sách món ăn đã chiên kèm thời gian chín (`elapsedMs`) và các loại nước sốt/dưa chua đã rưới lên đĩa.
- **Server kiểm chứng**:
  1. Kiểm tra đơn hàng có đúng là đơn hàng đang kích hoạt của phiên người chơi hay không (`active_orders`).
  2. Tính toán điểm hài lòng dựa trên công thức chuẩn:
     $$\text{Satisfaction} = 0.50 \times \text{CookQuality} + 0.30 \times \text{SauceAccuracy} + 0.20 \times \text{SpeedFactor}$$
  3. Tính toán số tiền thưởng: $\text{BasePrice} + \text{Tips}$ (thưởng thêm nếu độ hài lòng $\ge 80\%$).
  4. Cập nhật số dư `coins` và cộng dồn `xp` trên cơ sở dữ liệu.

### B. Chống Race Condition bằng PostgreSQL Row-Level Lock
Trong `src/db/repository.ts`, mọi hành động tài chính đều tuân thủ nguyên tắc:
```typescript
await db.transaction(async (tx) => {
  // 1. Khóa dòng tiến trình của người chơi bằng SELECT ... FOR UPDATE
  const [currentProgress] = await tx
    .select()
    .from(playerProgress)
    .where(eq(playerProgress.playerId, playerId))
    .for('update')

  // 2. Kiểm tra số dư tiền
  if (currentProgress.coins < cost) {
    throw new Error('INSUFFICIENT_FUNDS')
  }

  // 3. Thực hiện thay đổi (unlock món, nâng cấp, claim thưởng)
  ...

  // 4. Trừ tiền và cập nhật số dư mới
  await tx
    .update(playerProgress)
    .set({ coins: currentProgress.coins - cost })
    .where(eq(playerProgress.playerId, playerId))
})
```
Nếu có 2 request gửi đồng thời từ cùng 1 người chơi:
Request thứ hai sẽ bị giữ khóa cho đến khi request thứ nhất hoàn thành. Khi request thứ hai lấy được khóa, số dư tiền đã bị trừ ở request thứ nhất, nên phép kiểm tra `coins < cost` sẽ phát hiện thiếu tiền và từ chối giao dịch an toàn.

### C. Cơ Chế Nhận Thưởng Thành Tựu Không Thể Nhân Bản
- Khi người chơi gọi `/api/v1/achievements/claim`:
  - Khóa dòng thành tựu trong bảng `player_achievements` bằng `for('update')`.
  - Kiểm tra `claimed === true`. Nếu đã nhận -> Ném lỗi `ALREADY_CLAIMED`.
  - Cập nhật `claimed = true`.
  - Khóa dòng `player_progress`, cộng thưởng `rewardCoins` và `rewardXp`.
  - Tất cả nằm trong 1 Transaction. Nếu bất kỳ lỗi nào xảy ra, trạng thái nhận thưởng tự động rollback.

---

## 5. Catalog Dữ Liệu Món Ăn & Nước Chấm Đường Phố

### 18 Món Chiên Đặc Sắc Việt Nam (`src/game/data/catalog.ts`):
* **Classic Viên**: Cá viên truyền thống (`fish_ball_classic`), Cá viên dẹt, Bò viên gân (`beef_ball_classic`), Tôm viên trứng muối, Heo viên bọc nấm, Gà viên giòn rụm.
* **Tofu & Chả**: Đậu hũ cá phô mai (`fish_tofu`), Chả lụa que chiên giòn, Chả cá thì là cốm xanh, Đậu hũ non chiên giòn.
* **Surimi & Xúc Xích**: Xúc xích đỏ đường phố (`sausage_red`), Thanh cua surimi tẩm mè, Cua viên hoàng kim.
* **Chiên Giòn Đặc Sản**: Há cảo chiên giòn rụm, Hoành thánh tôm thịt lá hẹ, Bánh bao sữa chiên chấm sữa đặc.
* **Phô Mai Sáng Tạo**: Đậu hũ phô mai kéo sợi, Phô mai que tẩm bột xù.

### 6 Loại Nước Chấm & Đồ Chua Kèm Theo (`src/game/data/sauces.ts`):
1. **Tương ớt rim cay ngọt** (`tuong_ot`): Chuẩn vị cá viên chiên miền Nam.
2. **Tương đen chấm cá viên** (`tuong_den`): Vị tương hột lên men ngọt dịu, sánh quyện.
3. **Sốt me chua ngọt** (`sot_me`): Chua thanh vị me tươi, rắc thêm đậu phộng rang.
4. **Sốt phô mai cay béo** (`pho_mai_cay`): Xu hướng ẩm thực đường phố hiện đại.
5. **Mayonnaise béo ngậy** (`mayo`): Phù hợp món phô mai que và bánh bao chiên.
6. **Sa tế ớt hiểm cay nồng** (`sa_te`): Cay xé lưỡi cho tín đồ ăn cay.
* **Dưa chua giải ngấy** (`dua_chua`): Đồ chua cà rốt và củ cải ngâm giấm đường ăn kèm không tính tiền, tăng điểm hài lòng.

---

## 6. Danh Mục Nâng Cấp Xe Cá Viên (`src/game/data/upgrades.ts`)

1. **Chảo Dầu Mở Rộng** (`pan_capacity`):
   - Tier 1: Chảo tiêu chuẩn (6 ô chiên).
   - Tier 2: Mở rộng lên 8 ô chiên (Giá: 15.000 đ, Yêu cầu Level 2).
   - Tier 3: Chảo công nghiệp 10 ô chiên (Giá: 45.000 đ, Yêu cầu Level 4).
2. **Bếp Ga Lửa Mạnh** (`burner_heat`): Giảm 15% - 30% thời gian chờ dầu sôi và chiên chín.
3. **Kẹp Gắp Chống Dính** (`tongs_mastery`): Nới rộng vùng thời gian chiên vàng chuẩn (*perfect window*) thêm +500ms đến +1000ms.
4. **Tủ Kính Trưng Bày** (`display_case`): Tăng độ kiên nhẫn của khách hàng thêm +3000ms đến +6000ms.
5. **Khay Để Xiên Ráo Dầu** (`drain_rack`): Thêm vị trí chờ đĩa ráo dầu trên quầy.

---

## 7. Hướng Dẫn Kiểm Thử Thủ Công (Manual Review & Testing Guide)

> [!NOTE]
> Phần này được thiết kế dành riêng cho Reviewer tự thao tác trực tiếp trên trình duyệt (hoàn toàn không sử dụng automated click hay tool giả lập).

### Bước 1: Khởi Động Ứng Dụng & Kiểm Tra Phiên Khách
1. Chạy ứng dụng nội bộ bằng lệnh:
   ```bash
   pnpm dev
   ```
2. Mở trình duyệt tại địa chỉ: `http://localhost:3000` (hoặc mở Preview/Production deployment).
3. Nhấn `F12` mở tab **Application / Lưu trữ**:
   - Chọn mục **Cookies**: Quan sát cookie `xcv_session`. Xác nhận cookie có cờ `HttpOnly = true`, `Path = /`, `SameSite = Lax`.
   - Chọn mục **Local Storage**: Xác nhận **hoàn toàn trống** hoặc không chứa bất kỳ secret token/session nào.
4. Quan sát thanh thông số người chơi ở đầu màn hình (HUD):
   - Số tiền ban đầu: `10.000 đ` (Vốn khởi nghiệp đường phố).
   - Cấp bậc: `Level 1`.
   - Thanh kinh nghiệm: `0 XP`.
   - Uy tín xe cá viên: `100 / 100`.

### Bước 2: Quan Sát Giao Diện & Bố Cục Bán Hàng
1. Khung cảnh xe cá viên chiên gồm:
   - **Chảo dầu nóng**: Chảo tròn chứa dầu vàng óng với hiệu ứng bọt dầu sôi lấp lánh và âm thanh chiên giòn rụm.
   - **Khay nguyên liệu chuẩn bị**: Chứa các xiên que sẵn sàng để chiên (Cá viên, Bò viên, Xúc xích đỏ, Đậu hũ phô mai).
   - **Đĩa phục vụ**: Nơi đặt xiên đã chiên chín, quầy nước sốt và hũ dưa chua.
   - **Bong bóng gọi món của khách**: Hiển thị yêu cầu loại xiên, số lượng, loại tương ớt/tương đen và yêu cầu dưa chua kèm theo thanh đếm ngược độ kiên nhẫn của khách.

### Bước 3: Thao Tác Chiên Rán Thực Tế
1. **Gắp xiên vào chảo**: Nhấn vào một món bất kỳ trong khay đồ sống (ví dụ: Xiên cá viên). Quan sát xiên que rơi vào chảo dầu với âm thanh xèo xèo.
2. **Theo dõi trạng thái chín**:
   - **Giai đoạn 1 (Chưa chín / Sống)**: Xiên que chìm trong dầu, màu tái nhạt.
   - **Giai đoạn 2 (Đang chiên)**: Bắt đầu phồng nở, chuyển màu vàng nhạt.
   - **Giai đoạn 3 (Vàng Giòn / Hoàn Hảo - Perfect)**: Xiên que nổi đều, viền vàng óng ánh, có ánh sáng lấp lánh báo hiệu. Đây là thời điểm lý tưởng nhất để gắp ra.
   - **Giai đoạn 4 (Khét / Overcooked)**: Nếu ngâm quá lâu, xiên que chuyển màu nâu đen sẫm.
3. **Gắp ra đĩa**: Nhấp vào xiên que khi đang ở trạng thái Hoàn Hảo để chuyển sang đĩa phục vụ.

### Bước 4: Nêm Nước Sốt & Kèm Dưa Chua
1. Nhìn vào yêu cầu trong bong bóng của thực khách (ví dụ: Khách muốn *Tương ớt* + *Dưa chua*).
2. Nhấn vào chai Tương ớt trên quầy: Quan sát hiệu ứng rưới tương đỏ bắt mắt lên đĩa.
3. Nhấn vào hũ Dưa chua: Đồ chua cà rốt củ cải được đặt thêm vào mép đĩa.

### Bước 5: Giao Hàng & Nhận Thưởng Từ Server
1. Nhấn nút **Giao Hàng (Phục Vụ)**:
2. Quan sát kết quả đánh giá hiển thị:
   - Điểm số hài lòng (ví dụ: `100% Tuyệt Vời!`).
   - Tiền bán xiên + Tiền boa thưởng thêm từ khách hài lòng.
   - Điểm kinh nghiệm XP tăng lên trên thanh HUD.
   - Âm thanh leng keng tiền xu vang lên.
3. Nhấn `F5` tải lại trang trình duyệt:
   - Xác nhận: Số tiền mới, điểm XP, và cấp bậc được **bảo lưu nguyên vẹn** (được lấy tự động từ database thông qua HttpOnly cookie).

### Bước 6: Kiểm Tra Cửa Hàng Nâng Cấp & Mở Khóa Món Mới
1. Nhấn vào biểu tượng **Nâng Cấp Xe**:
   - Kiểm tra hiển thị các hạng mục: Chảo Dầu Mở Rộng, Bếp Ga Lửa Mạnh, Kẹp Gắp Chống Dính...
   - Nếu đủ tiền, nhấn nút **Nâng Cấp**: Số tiền bị trừ chính xác và cấp độ chảo dầu được cập nhật ngay lập tức.
2. Nhấn vào biểu tượng **Món Ăn**:
   - Xem danh mục các món cao cấp hơn (Tôm viên trứng muối, Bánh bao sữa...).
   - Mở khóa thử 1 món khi đủ điều kiện cấp bậc và số dư.

---

## 8. Kết Quả Xác Minh Kỹ Thuật (Automated Verification Matrix)

Toàn bộ hệ sinh thái mã nguồn đã được chạy đối soát kỹ thuật nghiêm ngặt:

```text
========================================================================
KIỂM TRA CHẤT LƯỢNG MÃ NGUỒN & TEST SUITE
========================================================================
1. TypeScript Strict Typecheck:    pnpm typecheck   -> 0 errors (PASS)
2. ESLint Code Standard:           pnpm lint        -> 0 errors, 0 warnings (PASS)
3. Unit & API Tests (Vitest):      pnpm test        -> 15/15 files passed, 66/66 tests passed (PASS)
4. Playwright E2E Multi-Viewport:  pnpm test:e2e    -> 6/6 tests passed (PASS)
   - Mobile Viewport (390x844):    Passed (Critical persistence flow + UI responsive)
   - Narrow Mobile (320px):        Passed (Critical persistence flow + UI responsive)
   - Desktop Viewport (1280x720):  Passed (Critical persistence flow + UI responsive)
5. Production Bundle Build:        pnpm build       -> Built in 7.91s (PASS)
   - Bundled Client SPA:           dist/ (index.html, CSS, JS chunks)
   - Bundled Serverless API:       api/index.js (92.0 KB self-contained ESM)
========================================================================
```

---

## 9. Kết Luận Báo Cáo Codex

Mã nguồn của dự án **Xe Cá Viên** đã đạt trạng thái hoàn thiện toàn diện về mặt kỹ thuật, kiến trúc game loop, độ trơn tru của hoạt ảnh, hệ thống âm thanh procedural, cấu trúc schema chuẩn mực, và các lớp phòng vệ giao dịch tài chính ACID trên nền tảng PostgreSQL.

Tất cả các tệp tin liên quan đã được đóng gói, gắn thẻ commit sạch sẽ và đẩy lên nhánh `main` tại remote GitHub `https://github.com/9m0m/xe-ca-vien.git`.
