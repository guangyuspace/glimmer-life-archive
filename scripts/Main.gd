extends Node

@export_file("*.tscn") var archive_scene_path: String = "res://scenes/ArchiveScene.tscn"
@export_range(0.0, 1.2, 0.05) var scene_fade_seconds: float = 0.22

var _current_scene: Node
var _fade: ColorRect


func _ready() -> void:
	_build_fade_layer()
	call_deferred("_show_archive")


func _show_archive() -> void:
	_change_child_scene(archive_scene_path)


func _build_fade_layer() -> void:
	_fade = ColorRect.new()
	_fade.color = Color.BLACK
	_fade.set_anchors_preset(Control.PRESET_FULL_RECT)
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_fade.modulate.a = 0.0
	add_child(_fade)


func _change_child_scene(scene_path: String) -> void:
	if _fade:
		_fade.move_to_front()
	
	if scene_fade_seconds > 0:
		var in_tween := create_tween()
		in_tween.tween_property(_fade, "modulate:a", 1.0, scene_fade_seconds).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
		await in_tween.finished

	if _current_scene:
		_current_scene.queue_free()
		_current_scene = null

	var packed_scene := load(scene_path) as PackedScene
	if packed_scene == null:
		push_error("Cannot load scene: %s" % scene_path)
		return

	_current_scene = packed_scene.instantiate()
	add_child(_current_scene)
	await get_tree().process_frame
	_current_scene.move_before(_fade)

	var out_tween := create_tween()
	out_tween.tween_property(_fade, "modulate:a", 0.0, scene_fade_seconds).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)
