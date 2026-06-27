extends Control

const STORY_PLAYER_SCENE := "res://scenes/StoryPlayer.tscn"
const TITLE_TEXT := "記憶的微光"
const HINT_TEXT := "點一下，打開一段人生"

var _art_pack: MobileArtPack = MobileArtPack.new()
var _orb_button: Button
var _orb_glow: Panel
var _layout_ready: bool = false


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build_scene()
	_update_layout()
	size_changed.connect(_on_size_changed)
	_start_orb_pulse()


func _on_size_changed() -> void:
	_update_layout()


func _build_scene() -> void:
	var background := ColorRect.new()
	background.color = Color(0.005, 0.006, 0.012, 1.0)
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	var ambient := Panel.new()
	ambient.set_anchors_preset(Control.PRESET_FULL_RECT)
	ambient.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var ambient_style := _art_pack.make_ambient_halo_style()
	ambient.add_theme_stylebox_override("panel", ambient_style)
	ambient.modulate = Color(1, 1, 1, 0.7)
	add_child(ambient)

	_orb_glow = Panel.new()
	_orb_glow.custom_minimum_size = Vector2(240, 240)
	_orb_glow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_orb_glow.set_anchors_preset(Control.PRESET_CENTER)
	var glow_style := _art_pack.make_ambient_halo_style()
	_orb_glow.add_theme_stylebox_override("panel", glow_style)
	_orb_glow.position = Vector2(-120, -120)
	add_child(_orb_glow)

	_orb_button = Button.new()
	_orb_button.text = ""
	_orb_button.tooltip_text = "點一下"
	_orb_button.custom_minimum_size = Vector2(156, 156)
	_orb_button.size = _orb_button.custom_minimum_size
	_orb_button.set_anchors_preset(Control.PRESET_CENTER)
	_orb_button.position = Vector2(-78, -78)
	_orb_button.focus_mode = Control.FOCUS_NONE
	_orb_button.add_theme_stylebox_override("normal", _art_pack.make_orb_button_style())
	_orb_button.add_theme_stylebox_override("hover", _art_pack.make_orb_hover_style())
	_orb_button.add_theme_stylebox_override("pressed", _art_pack.make_orb_pressed_style())
	_orb_button.pressed.connect(_on_orb_pressed)
	add_child(_orb_button)

	var title_panel := Panel.new()
	title_panel.set_anchors_preset(Control.PRESET_CENTER_TOP)
	title_panel.position = Vector2(-190, 56)
	title_panel.size = Vector2(380, 56)
	title_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	title_panel.add_theme_stylebox_override("panel", _art_pack.make_card_panel_style())
	add_child(title_panel)

	var title := Label.new()
	title.text = TITLE_TEXT
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	title.modulate = Color(0.90, 0.95, 1.0, 0.92)
	title.add_theme_font_size_override("font_size", 30)
	title.set_anchors_preset(Control.PRESET_FULL_RECT)
	title.position = Vector2(12, 0)
	title.size = Vector2(356, 56)
	title.mouse_filter = Control.MOUSE_FILTER_IGNORE
	title_panel.add_child(title)

	var hint_panel := Panel.new()
	hint_panel.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	hint_panel.position = Vector2(-160, -84)
	hint_panel.size = Vector2(320, 40)
	hint_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hint_panel.add_theme_stylebox_override("panel", _art_pack.make_card_panel_style())
	add_child(hint_panel)

	var hint := Label.new()
	hint.text = HINT_TEXT
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint.modulate = Color(0.76, 0.86, 0.96, 0.82)
	hint.add_theme_font_size_override("font_size", 18)
	hint.set_anchors_preset(Control.PRESET_FULL_RECT)
	hint.position = Vector2(12, 0)
	hint.size = Vector2(296, 40)
	hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hint_panel.add_child(hint)

	_layout_ready = true


func _update_layout() -> void:
	if not _layout_ready:
		return

	var viewport_size: Vector2 = get_viewport_rect().size
	var min_side: float = minf(viewport_size.x, viewport_size.y)
	var margin := clampf(min_side * 0.07, 16.0, 52.0)
	var glow_size := Vector2(margin * 4.5, margin * 4.5)
	var orb_size := Vector2(margin * 2.72, margin * 2.72)

	_orb_glow.custom_minimum_size = glow_size
	_orb_glow.size = glow_size
	_orb_glow.position = -glow_size * 0.5

	_orb_button.custom_minimum_size = orb_size
	_orb_button.size = orb_size
	_orb_button.position = -orb_size * 0.5

	for child in get_children():
		if child is Panel:
			var panel := child as Panel
			panel.position.x = min(panel.position.x, viewport_size.x)


func _start_orb_pulse() -> void:
	var tween := create_tween().set_loops()
	tween.tween_property(_orb_glow, "scale", Vector2(1.08, 1.08), 1.8).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.parallel().tween_property(_orb_glow, "modulate:a", 0.48, 1.8).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(_orb_glow, "scale", Vector2.ONE, 1.8).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.parallel().tween_property(_orb_glow, "modulate:a", 1.0, 1.8).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)


func _on_orb_pressed() -> void:
	get_tree().change_scene_to_file(STORY_PLAYER_SCENE)
