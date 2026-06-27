extends Control

const DEFAULT_STORY_PATH := "res://stories/story_001/story_001.json"
const ENDING_SCENE := "res://scenes/EndingBlackScreen.tscn"
const TYPEWRITER_SCRIPT := preload("res://scripts/TypewriterText.gd")

@export_file("*.json") var story_path: String = DEFAULT_STORY_PATH
@export_range(0.9, 3.0, 0.05) var hold_seconds: float = 1.5
@export_range(120.0, 320.0, 5.0) var wipe_distance: float = 180.0
@export_range(0.2, 1.6, 0.05) var image_fade_seconds: float = 0.45

var _art_pack: MobileArtPack = MobileArtPack.new()

var _image_layer: Control
var _texture_rect: TextureRect
var _placeholder: ColorRect
var _placeholder_label: Label
var _text_area: Panel
var _typewriter: TypewriterText
var _hint_label: Label
var _hold_progress: ProgressBar
var _error_label: Label

var _story_scenes: Array = []
var _scene_index: int = -1
var _current_scene_data: Dictionary = {}
var _is_transitioning: bool = false
var _is_holding: bool = false
var _hold_elapsed: float = 0.0
var _wipe_start: Vector2 = Vector2.ZERO
var _is_wiping: bool = false


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_PASS
	_build_ui()
	_update_layout()
	_load_story()
	size_changed.connect(_update_layout)


func _process(delta: float) -> void:
	if not _is_holding:
		return

	_hold_elapsed += delta
	_hold_progress.value = _hold_elapsed / hold_seconds
	if _hold_elapsed >= hold_seconds:
		_is_holding = false
		_complete_current_interaction()


func _input(event: InputEvent) -> void:
	if _is_transitioning or _story_scenes.is_empty():
		return

	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			_handle_press(event.position)
		else:
			_cancel_hold()
			_is_wiping = false
	elif event is InputEventScreenTouch:
		if event.pressed:
			_handle_press(event.position)
		else:
			_cancel_hold()
			_is_wiping = false
	elif event is InputEventMouseMotion and _is_wiping:
		_handle_wipe_motion(event.position)
	elif event is InputEventScreenDrag and _is_wiping:
		_handle_wipe_motion(event.position)


func _build_ui() -> void:
	var bg := TextureRect.new()
	bg.texture = _art_pack.make_faint_background()
	bg.stretch_mode = TextureRect.STRETCH_SCALE
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	var vignette := Panel.new()
	vignette.set_anchors_preset(Control.PRESET_FULL_RECT)
	vignette.modulate = Color(1, 1, 1, 0.75)
	vignette.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vignette.add_theme_stylebox_override("panel", _art_pack.make_ambient_halo_style())
	add_child(vignette)

	_image_layer = Control.new()
	_image_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_image_layer)

	var frame := Panel.new()
	frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	frame.add_theme_stylebox_override("panel", _art_pack.make_card_panel_style())
	_image_layer.add_child(frame)

	_texture_rect = TextureRect.new()
	_texture_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_texture_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	_texture_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	frame.add_child(_texture_rect)

	_placeholder = ColorRect.new()
	_placeholder.color = Color(0.06, 0.09, 0.13, 0.92)
	_placeholder.set_anchors_preset(Control.PRESET_FULL_RECT)
	_placeholder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	frame.add_child(_placeholder)

	_placeholder_label = Label.new()
	_placeholder_label.text = "畫面讀取中..."
	_placeholder_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_placeholder_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_placeholder_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_placeholder_label.modulate = Color(0.78, 0.84, 0.92, 0.7)
	_placeholder_label.add_theme_font_size_override("font_size", 24)
	_placeholder_label.set_anchors_preset(Control.PRESET_FULL_RECT)
	_placeholder_label.size = Vector2(-32, -32)
	_placeholder_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	frame.add_child(_placeholder_label)

	_text_area = Panel.new()
	_text_area.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_text_area.add_theme_stylebox_override("panel", _art_pack.make_card_panel_style())
	add_child(_text_area)

	_typewriter = TypewriterText.new()
	_typewriter.set_script(TYPEWRITER_SCRIPT)
	_typewriter.set_anchors_preset(Control.PRESET_FULL_RECT)
	_typewriter.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_typewriter.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	_typewriter.modulate = Color(0.94, 0.95, 0.98, 0.98)
	_typewriter.add_theme_font_size_override("font_size", 26)
	_typewriter.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_text_area.add_child(_typewriter)

	_hint_label = Label.new()
	_hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_hint_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	_hint_label.modulate = Color(0.75, 0.84, 0.94, 0.92)
	_hint_label.add_theme_font_size_override("font_size", 18)
	_hint_label.anchor_left = 0.0
	_hint_label.anchor_top = 1.0
	_hint_label.anchor_right = 1.0
	_hint_label.anchor_bottom = 1.0
	_hint_label.offset_top = -60
	_hint_label.offset_bottom = -12
	_hint_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_text_area.add_child(_hint_label)

	_hold_progress = ProgressBar.new()
	_hold_progress.min_value = 0.0
	_hold_progress.max_value = 1.0
	_hold_progress.value = 0.0
	_hold_progress.visible = false
	_hold_progress.show_percentage = false
	_hold_progress.anchor_left = 0.0
	_hold_progress.anchor_top = 1.0
	_hold_progress.anchor_right = 1.0
	_hold_progress.anchor_bottom = 1.0
	_hold_progress.offset_left = 18
	_hold_progress.offset_right = -18
	_hold_progress.offset_top = -28
	_hold_progress.offset_bottom = -12
	_hold_progress.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hold_progress.add_theme_stylebox_override("background", _art_pack.make_progress_bg())
	_hold_progress.add_theme_stylebox_override("fill", _art_pack.make_progress_fill())
	_text_area.add_child(_hold_progress)

	_error_label = Label.new()
	_error_label.visible = false
	_error_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_error_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_error_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_error_label.modulate = Color(1.0, 0.9, 0.8, 1.0)
	_error_label.add_theme_font_size_override("font_size", 24)
	_error_label.set_anchors_preset(Control.PRESET_FULL_RECT)
	_error_label.offset_left = 120
	_error_label.offset_right = -120
	_error_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_error_label)


func _update_layout() -> void:
	var viewport_size := get_viewport_rect().size
	if viewport_size.x <= 0 or viewport_size.y <= 0:
		return

	var margin := clampf(minf(viewport_size.x, viewport_size.y) * 0.06, 16.0, 44.0)
	var text_area_height := clampf(viewport_size.y * 0.34, 190.0, 320.0)
	var text_top := viewport_size.y - text_area_height - margin
	var image_height := max(180.0, text_top - margin * 1.2)

	_image_layer.position = Vector2(margin, margin)
	_image_layer.size = Vector2(viewport_size.x - margin * 2.0, image_height)

	var frame := _image_layer.get_child(0) as Panel
	frame.position = Vector2.ZERO
	frame.size = _image_layer.size

	_texture_rect.size = frame.size
	_placeholder.size = frame.size
	_placeholder_label.size = frame.size - Vector2(32, 32)

	_text_area.position = Vector2(margin, viewport_size.y - text_area_height - margin)
	_text_area.size = Vector2(viewport_size.x - margin * 2.0, text_area_height)
	_text_area.get_child(0).set_anchors_preset(Control.PRESET_FULL_RECT)
	_text_area.get_child(0).offset_left = 20
	_text_area.get_child(0).offset_top = 20
	_text_area.get_child(0).offset_right = -20
	_text_area.get_child(0).offset_bottom = -62

	_hold_progress.offset_left = 24
	_hold_progress.offset_right = -24


func _load_story() -> void:
	if not FileAccess.file_exists(story_path):
		_show_error("故事資料不存在\n%s\n\n請確認你有放到 story_001.json" % story_path)
		return

	var file := FileAccess.open(story_path, FileAccess.READ)
	if file == null:
		_show_error("讀取故事檔失敗\n請檢查權限與編碼")
		return

	var json := JSON.new()
	var parse_error := json.parse(file.get_as_text())
	if parse_error != OK:
		_show_error("故事檔格式錯誤\n第 %d 行：%s" % [json.get_error_line(), json.get_error_message()])
		return

	var data: Variant = json.data
	if data is Dictionary and data.has("scenes") and data["scenes"] is Array:
		_story_scenes = data["scenes"]
	elif data is Array:
		_story_scenes = data
	else:
		_show_error("故事格式不符，找不到 scenes")
		return

	if _story_scenes.is_empty():
		_show_error("故事清單是空的，無法播放")
		return

	_show_scene(0)


func _show_scene(index: int) -> void:
	if index < 0 or index >= _story_scenes.size():
		get_tree().change_scene_to_file(ENDING_SCENE)
		return

	var raw_scene: Variant = _story_scenes[index]
	if not (raw_scene is Dictionary):
		_show_error("第 %d 幕資料格式錯誤，請修正 JSON" % (index + 1))
		return

	_scene_index = index
	_current_scene_data = raw_scene as Dictionary
	_is_transitioning = true
	_reset_interaction_state()
	_play_scene_transition()


func _play_scene_transition() -> void:
	var fade_out := create_tween()
	fade_out.tween_property(_image_layer, "modulate:a", 0.0, image_fade_seconds)
	await fade_out.finished

	_apply_image(_current_scene_data.get("image", ""))
	_typewriter.start_typing(str(_current_scene_data.get("text", "")))
	_update_hint()

	var fade_in := create_tween()
	fade_in.tween_property(_image_layer, "modulate:a", 1.0, image_fade_seconds)
	await fade_in.finished
	_is_transitioning = false


func _apply_image(image_path: String) -> void:
	if image_path.is_empty() or not ResourceLoader.exists(image_path):
		_texture_rect.texture = null
		_placeholder.visible = true
		_placeholder_label.visible = true
		return

	var texture := load(image_path) as Texture2D
	if texture == null:
		_texture_rect.texture = null
		_placeholder.visible = true
		_placeholder_label.visible = true
		return

	_texture_rect.texture = texture
	_placeholder.visible = false
	_placeholder_label.visible = false


func _handle_press(position: Vector2) -> void:
	if not _typewriter.is_finished:
		_typewriter.skip_to_end()
		return

	var interaction := str(_current_scene_data.get("interaction", "tap"))
	match interaction:
		"tap":
			_complete_current_interaction()
		"hold":
			_is_holding = true
			_hold_elapsed = 0.0
			_hold_progress.value = 0.0
			_hold_progress.visible = true
		"wipe":
			_is_wiping = true
			_wipe_start = position
		_:
			_complete_current_interaction()


func _handle_wipe_motion(position: Vector2) -> void:
	if not _typewriter.is_finished:
		return

	if _wipe_start.distance_to(position) >= wipe_distance:
		_is_wiping = false
		_complete_current_interaction()


func _complete_current_interaction() -> void:
	if _is_transitioning:
		return

	_is_transitioning = true
	_reset_interaction_state()
	if bool(_current_scene_data.get("ending", false)):
		get_tree().change_scene_to_file(ENDING_SCENE)
	else:
		_show_scene(_scene_index + 1)


func _reset_interaction_state() -> void:
	_is_holding = false
	_hold_elapsed = 0.0
	_is_wiping = false
	_hold_progress.visible = false
	_hold_progress.value = 0.0


func _cancel_hold() -> void:
	if not _is_holding:
		return

	_is_holding = false
	_hold_elapsed = 0.0
	_hold_progress.value = 0.0


func _update_hint() -> void:
	var interaction := str(_current_scene_data.get("interaction", "tap"))
	match interaction:
		"hold":
			_hint_label.text = "按住，直到這一刻過去"
		"wipe":
			_hint_label.text = "輕輕擦去眼前的模糊"
		_:
			_hint_label.text = "點擊繼續"


func _show_error(message: String) -> void:
	_error_label.visible = true
	_error_label.text = message
	_text_area.visible = false
	_image_layer.visible = false
	set_process(false)
