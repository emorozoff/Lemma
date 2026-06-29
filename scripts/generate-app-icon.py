#!/usr/bin/env python3
"""Генерация иконки Lemma: вариант A — двухцветная l_ (чёрная l + красный _) на белом.
Рисуется геометрически (скруглённые брусья) и суперсэмплится для гладких краёв.
Перезаписывает public/icons/icon-*.png всех размеров."""
import os
from PIL import Image, ImageDraw

SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 180, 192, 512]
BG = (255, 255, 255)
BLACK = (17, 17, 17)
RED = (229, 52, 43)
SUPER = 4  # суперсэмплинг для гладких краёв

# Геометрия в долях от размера. l — вертикальный брус, _ — горизонтальный у базовой линии.
L = (0.315, 0.260, 0.425, 0.740)   # x0, y0, x1, y1  (чёрная l)
U = (0.455, 0.660, 0.685, 0.740)   # x0, y0, x1, y1  (красный _)


def render(size: int) -> Image.Image:
    s = size * SUPER
    img = Image.new("RGB", (s, s), BG)
    d = ImageDraw.Draw(img)
    lx0, ly0, lx1, ly1 = (v * s for v in L)
    d.rounded_rectangle([lx0, ly0, lx1, ly1], radius=(lx1 - lx0) / 2, fill=BLACK)
    ux0, uy0, ux1, uy1 = (v * s for v in U)
    d.rounded_rectangle([ux0, uy0, ux1, uy1], radius=(uy1 - uy0) / 2, fill=RED)
    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
    for s in SIZES:
        render(s).save(os.path.join(out, f"icon-{s}.png"))
        print(f"icon-{s}.png")
    print("done")
