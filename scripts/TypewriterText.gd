class_name TypewriterText
extends Label

signal typing_finished

@export_range(5.0, 120.0, 1.0) var characters_per_second: float = 34.0
@export_range(0.0, 0.8, 0.01) var comma_pause: float = 0.08
@export_range(0.0, 0.8, 0.01) var period_pause: float = 0.18
@export_range(0.0, 0.8, 0.01) var newline_pause: float = 0.16

var is_finished: bool = true

var _full_text: String = ""
var _character_index: int = 0
var _accumulator: float = 0.0
var _pause_remaining: float = 0.0


func start_typing(new_text: String) -> void:
	_full_text = new_text
	text = _full_text
	visible_characters = 0
	_character_index = 0
	_accumulator = 0.0
	_pause_remaining = 0.0
	is_finished = _full_text.is_empty()
	set_process(not is_finished)

	if is_finished:
		visible_characters = -1
		typing_finished.emit()


func skip_to_end() -> void:
	if is_finished:
		return

	_character_index = _full_text.length()
	visible_characters = -1
	_finish()


func _process(delta: float) -> void:
	if is_finished:
		return

	if _pause_remaining > 0.0:
		_pause_remaining = maxf(0.0, _pause_remaining - delta)
		return

	_accumulator += delta * characters_per_second
	while _accumulator >= 1.0 and _character_index < _full_text.length():
		_accumulator -= 1.0
		_character_index += 1
		visible_characters = _character_index
		_pause_remaining = _pause_for_character(_full_text.substr(_character_index - 1, 1))
		if _pause_remaining > 0.0:
			break

	if _character_index >= _full_text.length():
		visible_characters = -1
		_finish()


func _pause_for_character(character: String) -> float:
	match character:
		"，", "、", ",":
			return comma_pause
		"。", "！", "？", "；", ";", ".", "!", "?":
			return period_pause
		"\n":
			return newline_pause
		_:
			return 0.0


func _finish() -> void:
	is_finished = true
	set_process(false)
	typing_finished.emit()
