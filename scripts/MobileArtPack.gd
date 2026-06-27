class_name MobileArtPack
extends RefCounted

const _TEX_SIZE := Vector2i(256, 256)
const _TEXTURE_CACHE_KEY := "texture_%s"
const _STYLE_CACHE_KEY := "style_%s"

var _texture_cache: Dictionary = {}
var _style_cache: Dictionary = {}


func _create_noise_texture(
	key: String,
	top_color: Color,
	bottom_color: Color,
	ring: float = 0.15,
	dot: float = 0.07,
	light: float = 0.08
) -> Texture2D:
	var cache_key := _TEXTURE_CACHE_KEY % [key]
	if _texture_cache.has(cache_key):
		return _texture_cache[cache_key]

	var image := Image.create(_TEX_SIZE.x, _TEX_SIZE.y, false, Image.FORMAT_RGBA8)
	for y in _TEX_SIZE.y:
		var v := float(y) / float(max(_TEX_SIZE.y - 1, 1))
		var row := top_color.lerp(bottom_color, v)
		for x in _TEX_SIZE.x:
			var u := float(x) / float(max(_TEX_SIZE.x - 1, 1))
			var nx := sin((u * 16.0) + (v * 9.0) + dot * 100.0)
			var ny := cos((u * 12.0) - (v * 11.0) - dot * 70.0)
			var grain := (nx * ny) * 0.12
			var center_x := u - 0.5
			var center_y := v - 0.5
			var distance := sqrt((center_x * center_x) + (center_y * center_y))
			var ring_glow := clampf(1.0 - (distance / max(ring, 0.01)), 0.0, 1.0)
			var c := Color(
				clampf(row.r + grain * 0.11 + ring_glow * light + u * light, 0.0, 1.0),
				clampf(row.g + grain * 0.11 + ring_glow * (light * 0.85) + v * (light * 0.85), 0.0, 1.0),
				clampf(row.b + grain * 0.11 + ring_glow * (light * 0.65) + (1.0 - u) * (light * 0.8), 0.0, 1.0),
				1.0
			)
			image.set_pixel(x, y, c)

	var texture := ImageTexture.create_from_image(image)
	_texture_cache[cache_key] = texture
	return texture


func _create_style(
	key: String,
	texture: Texture2D,
	left: float,
	top: float,
	right: float,
	bottom: float
) -> StyleBoxTexture:
	var cache_key := _STYLE_CACHE_KEY % [key]
	if _style_cache.has(cache_key):
		return _style_cache[cache_key]

	var style := StyleBoxTexture.new()
	style.texture = texture
	style.texture_margin_left = left
	style.texture_margin_top = top
	style.texture_margin_right = right
	style.texture_margin_bottom = bottom
	var result := style.duplicate(true)
	_style_cache[cache_key] = result
	return result


func make_faint_background() -> Texture2D:
	return _create_noise_texture(
		"faint_bg",
		Color(0.03, 0.04, 0.07, 1.0),
		Color(0.04, 0.05, 0.08, 1.0),
		0.16,
		0.06,
		0.07
	)


func make_card_panel_style() -> StyleBoxTexture:
	var tex := _create_noise_texture(
		"card_panel",
		Color(0.05, 0.07, 0.10, 0.93),
		Color(0.02, 0.03, 0.07, 0.82),
		0.28,
		0.08,
		0.15
	)
	return _create_style("card_panel", tex, 24, 20, 24, 20)


func make_ambient_halo_style() -> StyleBoxTexture:
	var tex := _create_noise_texture(
		"ambient_halo",
		Color(0.23, 0.56, 1.0, 0.22),
		Color(0.08, 0.13, 0.20, 0.02),
		0.45,
		0.18,
		0.22
	)
	return _create_style("ambient_halo", tex, 28, 28, 28, 28)


func make_orb_button_style() -> StyleBoxTexture:
	var tex := _create_noise_texture(
		"orb",
		Color(0.28, 0.59, 1.0, 0.88),
		Color(0.22, 0.42, 0.80, 0.88),
		0.24,
		0.09,
		0.10
	)
	return _create_style("orb", tex, 60, 60, 60, 60)


func make_orb_hover_style() -> StyleBoxTexture:
	var tex := _create_noise_texture(
		"orb_hover",
		Color(0.46, 0.74, 1.0, 0.95),
		Color(0.30, 0.58, 0.90, 0.95),
		0.24,
		0.10,
		0.16
	)
	return _create_style("orb_hover", tex, 62, 62, 62, 62)


func make_orb_pressed_style() -> StyleBoxTexture:
	var tex := _create_noise_texture(
		"orb_pressed",
		Color(0.82, 0.95, 1.0, 0.98),
		Color(0.52, 0.78, 1.0, 0.94),
		0.20,
		0.13,
		0.18
	)
	return _create_style("orb_pressed", tex, 62, 62, 62, 62)


func make_button_style() -> StyleBoxTexture:
	var tex := _create_noise_texture(
		"story_button",
		Color(0.19, 0.22, 0.30, 0.95),
		Color(0.08, 0.11, 0.18, 0.95),
		0.22,
		0.07,
		0.08
	)
	return _create_style("story_button", tex, 24, 14, 24, 14)


func make_progress_bg() -> StyleBoxTexture:
	var tex := _create_noise_texture(
		"progress_bg",
		Color(0.09, 0.10, 0.16, 0.55),
		Color(0.17, 0.20, 0.30, 0.55),
		0.16,
		0.06,
		0.05
	)
	return _create_style("progress_bg", tex, 6, 6, 6, 6)


func make_progress_fill() -> StyleBoxTexture:
	var tex := _create_noise_texture(
		"progress_fill",
		Color(0.80, 0.90, 1.0, 0.95),
		Color(0.40, 0.74, 1.0, 0.95),
		0.14,
		0.09,
		0.10
	)
	return _create_style("progress_fill", tex, 6, 6, 6, 6)
