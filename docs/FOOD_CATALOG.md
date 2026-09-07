# Xe Cá Viên — Initial Food Catalog

This is a **game content catalog**, not a claim that every cart in Southern Vietnam sells every listed item. Keep the recognizable core authentic, then use broader Vietnamese fried-skewer/snack items as later unlocks.

Use stable ASCII ids in code and Vietnamese display names in UI.

## A. Classic viên

1. `fish_ball_classic` — Cá viên
2. `fish_ball_flat` — Cá viên dẹt
3. `fish_ball_vegetable` — Cá viên rau củ
4. `fish_ball_green_rice` — Cá viên cốm xanh
5. `fish_ball_quail_egg` — Cá viên trứng cút
6. `fish_ball_mayo` — Cá viên sốt mayo
7. `beef_ball_classic` — Bò viên
8. `beef_ball_pepper` — Bò viên tiêu
9. `shrimp_ball_classic` — Tôm viên
10. `squid_ball_classic` — Mực viên
11. `squid_ball_vegetable` — Mực viên rau củ
12. `seafood_ball` — Hải sản viên
13. `scallop_ball` — Sò điệp viên
14. `lobster_ball` — Tôm hùm viên
15. `cheese_ball` — Phô mai viên
16. `cheese_ball_melting` — Viên phô mai tan chảy
17. `seafood_cheese` — Hải sản sốt phô mai
18. `seafood_mayo` — Hải sản sốt mayo

## B. Cá/chả/đậu hũ

19. `fish_tofu` — Đậu hũ cá
20. `cheese_tofu` — Đậu hũ phô mai
21. `fish_cake` — Chả cá
22. `fish_cake_long_bean` — Chả cá đậu đũa
23. `fish_cake_chili` — Chả cá bọc ớt
24. `fish_cake_quail_egg` — Chả cá bọc trứng cút
25. `fish_cake_corn_veg` — Chả cá sữa bắp rau củ
26. `crab_roll` — Chả cua cuốn
27. `seafood_stuffed_snail` — Ốc nhồi hải sản
28. `basa_stuffed_snail` — Ốc nhồi basa

## C. Xúc xích / hồ lô / meat snacks

29. `sausage_red` — Xúc xích đỏ
30. `sausage_smoked` — Xúc xích xông khói
31. `sausage_german` — Xúc xích Đức
32. `sausage_french` — Xúc xích Pháp
33. `sausage_cheese` — Xúc xích phô mai
34. `sausage_spiral` — Xúc xích lốc xoáy
35. `ho_lo` — Hồ lô
36. `ho_lo_thai` — Hồ lô Thái
37. `pork_cartilage_sausage` — Dồi sụn
38. `beef_lolot` — Bò cuộn lá lốt

## D. Surimi / seafood shapes

39. `crab_stick` — Thanh cua
40. `shrimp_surimi` — Tôm surimi
41. `squid_twist` — Mực xoắn
42. `shrimp_twist` — Tôm xoắn
43. `scallop_surimi` — Sò điệp surimi
44. `seafood_bag` — Túi tiền hải sản
45. `seafood_bread` — Bánh mì hải sản
46. `salmon_sandwich` — Cá hồi sandwich

## E. Dumpling / wrapped snacks

47. `ha_cao` — Há cảo
48. `fried_wonton` — Hoành thánh chiên
49. `shrimp_dumpling` — Sủi cảo tôm
50. `xiu_mai` — Xíu mại
51. `mini_fried_bao` — Bánh bao chiên
52. `fish_roe_bao` — Bánh bao trứng cá
53. `spring_roll_meat` — Chả giò nhân thịt
54. `cha_ram` — Chả ram

## F. Cheese / crispy snack extensions

55. `cheese_stick` — Phô mai que
56. `green_rice_cheese_stick` — Phô mai que cốm
57. `fresh_milk_cake` — Bánh sữa tươi chiên
58. `fried_sour_sausage` — Nem chua rán
59. `chicken_cheese_cake` — Bánh gà phô mai
60. `french_fries` — Khoai tây chiên

## Launch grouping suggestion

Do not unlock all 60 immediately.

Tier 1:

- 1, 7, 9, 19, 21, 29, 35, 47

Tier 2:

- 3, 8, 10, 20, 22, 30, 39, 48, 50

Tier 3:

- 4, 11, 12, 15, 31, 33, 40, 41, 55

Tier 4:

- 5, 6, 13, 17, 18, 23, 24, 42, 43, 51, 52

Tier 5:

- remaining specialty items

## Sauces and serving modifiers

Keep sauces as separate data, not food entries:

- Tương ớt
- Tương cà
- Tương đen / sốt ngọt
- Mayonnaise
- Sốt mayo cay
- Sốt me
- Sốt bơ tỏi
- Sốt sa tế
- Sốt nước mắm
- Sốt chua ngọt
- Muối ớt / seasoning
- Dưa chua ăn kèm

## Data rule

Adding a normal item must be a catalog-data task, not a new gameplay-system task.

Before commissioning final art for any item:

1. confirm its silhouette is distinct from nearby catalog items
2. choose shapeProfile
3. choose one canonical camera angle
4. choose realistic raw/perfect color references
5. verify Vietnamese display name
