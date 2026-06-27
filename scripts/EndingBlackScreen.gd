extends Control

const ENDING_TEXT := """你剛剛度過的，
是真實存在的微光。
他叫【外公的名字】，西元 1936 年出生於江西，2025 年 12 月 18 日逝世於台灣。

他用盡一生的流離與汗水，在鞋廠、在鋼鐵廠、在計程車上，
為他的兒女、以及在 1995 年被他抱在懷裡滿月的大外孫，
撐起了一片長達數十年的無雨晴空。

歷史書上的一行字，往往是某個人波瀾壯闊的一生。
謝謝你，走過我外公的人生。

如果此刻，你想起了誰，請別把那份想念留到太晚。
去靠近他，去陪他吃一頓飯，
去握住那雙曾經牽過你的手。
每一段來得及的陪伴，
都是生命裡還亮著的微光。"""

@export var black_screen_duration: float = 3.0
@export var use_debug_duration: bool = false
@export var debug_black_screen_duration: float = 3.0
@export_range(8.0, 36.0, 1.0) var text_fade_seconds: float = 16.0
@export_range(0.0, 3.0, 0.1) var button_fade_seconds: float = 1.6
@export_file("*.ogg") var ending_audio_path: String = "res://audio/piano_ending.ogg"

var _art_pack: MobileArtPack = MobileArtPack.new()
var _ending_text: Label
var _story_button: Button
var _audio_player: AudioStreamPlayer


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build_ui()
	_try_play_ending_audio()
	_run_ending_sequence()


func _build_ui() -> void:
	var bg := TextureRect.new()
	bg.texture = _art_pack.make_faint_background()
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_SCALE
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	var overlay := Panel.new()
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	overlay.add_theme_stylebox_override("panel", _art_pack.make_ambient_halo_style())
	overlay.modulate = Color(0, 0, 0, 0.35)
	add_child(overlay)

	_ending_text = Label.new()
	_ending_text.text = ENDING_TEXT
	_ending_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_ending_text.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_ending_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_ending_text.modulate = Color(0.93, 0.93, 0.92, 0.0)
	_ending_text.add_theme_font_size_override("font_size", 28)
	_ending_text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_ending_text.set_anchors_preset(Control.PRESET_FULL_RECT)
	_ending_text.offset_left = 88
	_ending_text.offset_right = -88
	_ending_text.offset_top = 56
	_ending_text.offset_bottom = -132
	add_child(_ending_text)

	_story_button = Button.new()
	_story_button.text = "寫下你的故事"
	_story_button.visible = false
	_story_button.disabled = false
	_story_button.custom_minimum_size = Vector2(220, 58)
	_story_button.size = _story_button.custom_minimum_size
	_story_button.focus_mode = Control.FOCUS_NONE
	_story_button.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_story_button.position = Vector2(-110, -50)
	_story_button.modulate = Color(1, 1, 1, 0.0)
	_story_button.add_theme_stylebox_override("normal", _art_pack.make_button_style())
	_story_button.add_theme_stylebox_override("hover", _art_pack.make_progress_fill())
	_story_button.add_theme_stylebox_override("pressed", _art_pack.make_orb_pressed_style())
	add_child(_story_button)


func _try_play_ending_audio() -> void:
	if not ResourceLoader.exists(ending_audio_path):
		return

	var stream := load(ending_audio_path) as AudioStream
	if stream == null:
		return

	_audio_player = AudioStreamPlayer.new()
	_audio_player.stream = stream
	_audio_player.bus = "Master"
	add_child(_audio_player)
	_audio_player.play()


func _run_ending_sequence() -> void:
	var duration := black_screen_duration
	if use_debug_duration:
		duration = debug_black_screen_duration

	await get_tree().create_timer(duration).timeout

	var text_tween := create_tween()
	text_tween.tween_property(_ending_text, "modulate:a", 1.0, text_fade_seconds).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	await text_tween.finished

	_story_button.visible = true
	var btn_tween := create_tween()
	btn_tween.tween_property(_story_button, "modulate:a", 1.0, button_fade_seconds)
