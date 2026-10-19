"""Blender 5.x: editable camera-projected harbor architecture, exported without duplicate textures.

Run: blender --background --python scripts/build-painted-harbor.py
The camera projection is intentionally limited to a small viewing envelope on the web.
"""
import bpy
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'design' / 'harbor'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
image = bpy.data.images.load(str(OUT / 'harbor-painting.png'))
image.pack()
material = bpy.data.materials.new('Original painted light — camera projection')
material.use_nodes = True
nodes = material.node_tree.nodes
nodes.clear()
tex = nodes.new('ShaderNodeTexImage')
tex.image = image
emission = nodes.new('ShaderNodeEmission')
output = nodes.new('ShaderNodeOutputMaterial')
material.node_tree.links.new(tex.outputs['Color'], emission.inputs['Color'])
material.node_tree.links.new(emission.outputs[0], output.inputs[0])
architecture = bpy.data.collections.new('Harbor — projected architectural volumes')
bpy.context.scene.collection.children.link(architecture)
aspect = image.size[0] / image.size[1]
view_h = math.tan(math.radians(35 / 2)) * 20

def mesh(name, vertices, faces):
    # Author in image coordinates; Blender Y points away from the viewing camera.
    data = bpy.data.meshes.new(name)
    data.from_pydata([(u-.5, -depth, .5-v) for u,v,depth in vertices], [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    architecture.objects.link(obj)
    data.materials.append(material)
    uv = data.uv_layers.new(name='Camera painting UV')
    for polygon in data.polygons:
        for loop in polygon.loop_indices:
            u,v,_ = vertices[data.loops[loop].vertex_index]
            uv.data[loop].uv = (u, 1-v)
    return obj

def volume(name, outline, depth, thickness=.12):
    n = len(outline)
    vertices = [(u,v,depth) for u,v in outline] + [(u,v,depth-thickness) for u,v in outline]
    faces = [tuple(range(n)), tuple(range(2*n-1,n-1,-1))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name, vertices, faces)

def building(name, x, top, w, bottom, depth, roof=.012):
    return volume(name, [(x,bottom),(x+w,bottom),(x+w,top+roof),(x+w*.52,top),(x,top+roof)], depth, .18)

# Individually editable waterfront volumes, placed against the approved painting.
for row in range(3):
    for i in range(24):
        x = .385 + i*.026
        top = .675 - (x-.385)*.33 - row*.052 + math.sin(i*2.7+row)*.009
        bottom = top+.052+row*.014
        building(f'City / terrace {row+1} / house {i+1:02}', x, top, .023, bottom,
                 .30 + (x-.385)*.85 + (2-row)*.1)

# Major silhouettes: each tower includes a modeled shaft, shoulder and pointed crown.
for name,x,top,w,bottom,depth in [
    ('Cathedral spire',.919,.166,.042,.558,1.0),
    ('Clock tower',.799,.338,.026,.526,.8),
    ('Waterside bell tower',.865,.394,.027,.579,.85),
    ('Left bell tower',.576,.512,.018,.628,.48),
    ('Central campanile',.650,.469,.020,.607,.60),
]:
    volume(name, [(x,bottom),(x+w,bottom),(x+w,top+.10),(x+w*.73,top+.065),
                  (x+w*.5,top),(x+w*.27,top+.065),(x,top+.10)],depth,.18)

building('Foreground / waterfront hall',.764,.638,.222,.848,1.35,.037)
building('Waterfront / arcaded hall',.587,.665,.155,.791,1.02,.026)
building('Waterfront / west colonnade',.476,.687,.111,.778,.72,.014)

# Pier deck is a closed solid with independently modeled piles, braces and planks.
volume('Pier / deck',[(.748,.851),(.986,.846),(1,.902),(.777,.910)],1.68,.15)
for i in range(14):
    x=.778+i*.016
    volume(f'Pier / pile {i+1:02}',[(x,.874),(x+.004,.874),(x+.004,.985),(x,.985)],1.72,.10)
    volume(f'Pier / diagonal brace {i+1:02}',[(x,.884),(x+.003,.884),(x+.012,.937),(x+.009,.937)],1.76,.04)
for i in range(17):
    y=.852+i*.0027
    volume(f'Pier / plank {i+1:02}',[(.779,y),(.996,y-.006),(.996,y-.005),(.779,y+.001)],1.70,.02)

# Actual colonnade arch strips, rather than cuboids with smooth generic materials.
for i in range(12):
    x=.600+i*.0108
    outline=[]
    for j in range(17):
        a=math.pi*j/16
        outline.append((x+.0044*math.cos(a),.721-.021*math.sin(a)))
    for j in range(16,-1,-1):
        a=math.pi*j/16
        outline.append((x+.0034*math.cos(a),.721-.017*math.sin(a)))
    volume(f'Arcade / arch {i+1:02}',outline,1.12,.035)
    volume(f'Arcade / column {i+1:02}',[(x-.0048,.719),(x-.0037,.719),(x-.0037,.785),(x-.0048,.785)],1.14,.055)

# Foreground sailboat, modeled from its painted silhouette; no standalone plastic prop.
volume('Sailboat / main sail',[(.706,.701),(.681,.866),(.708,.851)],1.82,.025)
volume('Sailboat / jib',[(.710,.721),(.713,.855),(.727,.867)],1.79,.02)
volume('Sailboat / hull',[(.667,.886),(.698,.894),(.733,.881),(.724,.927),(.693,.933),(.673,.910)],1.86,.11)
volume('Sailboat / mast',[(.707,.697),(.709,.697),(.709,.897),(.707,.897)],1.89,.015)

# GLB contains only geometry + UV; the web shares its background texture and water shader.
neutral = bpy.data.materials.new('Web material supplied by renderer')
neutral.diffuse_color = (.7,.6,.4,1)
for obj in architecture.objects:
    obj.data.materials[0] = neutral
bpy.ops.object.select_all(action='DESELECT')
for obj in architecture.objects:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/painted-harbor-v1.glb'),
    export_format='GLB',use_selection=True,export_materials='NONE',export_yup=True)

# Restore the full editable painted scene and projection-correct presentation camera.
for obj in architecture.objects:
    obj.data.materials[0] = material
    for vert in obj.data.vertices:
        d = -vert.co.y
        vert.co.x *= view_h*aspect*(10-d)/10
        vert.co.z *= view_h*(10-d)/10
back = mesh('Sky and distant painting',[(0,0,0),(1,0,0),(1,1,0),(0,1,0)],[(0,1,2,3)])
for v in back.data.vertices:
    v.co.x *= view_h*aspect
    v.co.z *= view_h
camera_data=bpy.data.cameras.new('Website projection camera')
camera=bpy.data.objects.new('Website projection camera',camera_data)
bpy.context.scene.collection.objects.link(camera)
camera.location=(0,-10,0)
camera.rotation_euler=(math.pi/2,0,0)
camera_data.type='PERSP'
camera_data.lens_unit='FOV'
camera_data.angle=2*math.atan(math.tan(math.radians(17.5))*aspect)
scene=bpy.context.scene
scene.camera=camera
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=image.size[0]
scene.render.resolution_y=image.size[1]
scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(OUT/'blender-camera-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'painted-harbor.blend'))
bpy.ops.render.render(write_still=True)
print('Harbor export complete:',len(architecture.objects),'editable meshes')
