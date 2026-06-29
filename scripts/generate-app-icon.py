#!/usr/bin/env python3
"""Генерация иконки Lemma: вариант A — двухцветная l_ (чёрная печатная l + красный _)
на белом, настоящим глифом IBM Plex Mono Bold (как вордмарк).
Перезаписывает public/icons/icon-*.png всех размеров."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(__file__)
FONT = os.path.join(HERE, "IBMPlexMono-Bold.ttf")
OUT = os.path.join(HERE, "..", "public", "icons")

SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 180, 192, 512]
BG = (255, 255, 255)
BLACK = (17, 17, 17)
RED = (229, 52, 43)
SUPER = 4              # суперсэмплинг для гладких краёв
FONT_RATIO = 0.72      # кегль шрифта относительно размера иконки
TEXT = "l_"


def render(size: int) -> Image.Image:
    s = size * SUPER
    img = Image.new("RGB", (s, s), BG)
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, int(s * FONT_RATIO))

    # Центрируем строку "l_" по её bbox.
    bbox = d.textbbox((0, 0), TEXT, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    ox = (s - tw) / 2 - bbox[0]
    oy = (s - th) / 2 - bbox[1]

    # Двухцветно: l — чёрная, _ — красная (моноширинный, шаг = ширина "l").
    adv = d.textlength("l", font=font)
    d.text((ox, oy), "l", font=font, fill=BLACK)
    d.text((ox + adv, oy), "_", font=font, fill=RED)

    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    for s in SIZES:
        render(s).save(os.path.join(OUT, f"icon-{s}.png"))
        print(f"icon-{s}.png")
    print("done")
