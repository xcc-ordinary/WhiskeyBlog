"""Render a real camera move through the rebuilt geometry, not an image warp."""
import bpy
import math
import os
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/os.environ.get('HARBOR_OUTPUT','design/harbor-volumetric')
bpy.ops.wm.open_mainfile(filepath=str(OUT/os.environ.get('HARBOR_SCENE','volumetric-harbor.blend')))
scene=bpy.context.scene
camera=scene.camera
scene.render.resolution_x=960
scene.render.resolution_y=600
scene.cycles.samples=int(os.environ.get('HARBOR_SAMPLES','16'))
scene.cycles.use_denoising=True
scene.render.use_persistent_data=True
prefs=bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type='OPTIX';prefs.get_devices()
for device in prefs.devices: device.use=device.type=='OPTIX'
scene.cycles.device='GPU'
(OUT/'frames').mkdir(exist_ok=True)
for i in range(25):
    # A smooth turn and return: geometry changes its occlusion over the whole move.
    t=(1-math.cos(math.tau*i/24))/2
    camera.location=Vector((-3,-30,5.4)).lerp(Vector((-9,-23,7.2)),t)
    target=Vector((3,10,8)).lerp(Vector((6,10,8)),t)
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/'frames'/f'{i:03}.png')
    bpy.ops.render.render(write_still=True)
