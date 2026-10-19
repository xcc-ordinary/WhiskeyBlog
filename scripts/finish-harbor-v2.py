"""Final lighting and framing fixes; can rerender the saved v2 without rebuilding it."""
import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'design/harbor-refined-v2'

def finish(scene):
    if not scene.get('v2_finishing_applied'):
        for obj in scene.objects:
            if not obj.name.startswith('Skyline /'):continue
            inverse=obj.matrix_world.inverted()
            if obj.type=='MESH':
                for v in obj.data.vertices:
                    world=obj.matrix_world@v.co
                    world.z=4+(world.z-4)*.74
                    v.co=inverse@world
            elif obj.type=='CURVE':
                for spline in obj.data.splines:
                    for p in spline.points:
                        world=obj.matrix_world@Vector(p.co[:3]);world.z=4+(world.z-4)*.74
                        local=inverse@world;p.co=(*local,1)
        scene['v2_finishing_applied']=True
    glass=bpy.data.materials.get('Reflective smoked window glass')
    if glass is None:
        glass=bpy.data.materials.new('Reflective smoked window glass');glass.use_nodes=True
        shader=glass.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value=(.048,.091,.12,1)
        shader.inputs['Roughness'].default_value=.14
        shader.inputs['Metallic'].default_value=.38
    bsdf=glass.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Coat Weight'].default_value=.30
    bsdf.inputs['Coat Roughness'].default_value=.10
    for obj in scene.objects:
        if obj.type=='MESH' and 'recessed glass' in obj.name and obj.data.materials:
            obj.data.materials[0]=glass
    # Continuous support under the turned balcony balusters, rather than hanging rods.
    for label,loc,size in [('Loggia / balcony lower rail',(11,3.52,4.10),(13.3,.19,.11)),
                           ('Loggia / rear balcony support',(11,3.52,4.31),(13.3,.13,.075))]:
        if label in bpy.data.objects:continue
        x,y,z=[v/2 for v in size]
        data=bpy.data.meshes.new(label)
        data.from_pydata([(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],[],
                         [(3,2,1,0),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)])
        data.update();obj=bpy.data.objects.new(label,data);scene.collection.children['Loggia'].objects.link(obj)
        obj.location=loc;data.materials.append(bpy.data.materials['Warm cut limestone'])
        mod=obj.modifiers.new('Rail edge','BEVEL');mod.width=.018;mod.segments=2
    cloud=bpy.data.materials['Cumulus / layered density and soft boundary']
    ramp=next(n for n in cloud.node_tree.nodes if n.type=='VALTORGB')
    ramp.color_ramp.elements[0].color=(.004,.004,.004,1)
    ramp.color_ramp.elements[-1].color=(.075,.075,.075,1)
    volume=next(n for n in cloud.node_tree.nodes if n.type=='PRINCIPLED_VOLUME')
    volume.inputs['Color'].default_value=(.985,.99,1,1)
    volume.inputs['Anisotropy'].default_value=.10
    scene.cycles.volume_bounces=3
    scene.cycles.volume_step_rate=1.5
    sky=next(n for n in scene.world.node_tree.nodes if n.type=='TEX_SKY')
    sky.air_density=.95;sky.aerosol_density=.55;sky.sun_elevation=math.radians(12)
    sky.sun_rotation=math.radians(116)
    sun=bpy.data.objects.get('Golden grazing sunlight')
    sun.rotation_euler=Vector((-.42,.86,.29)).normalized().to_track_quat('Z','Y').to_euler()
    sun.data.energy=2.7;sun.data.color=(1,.78,.45);sun.data.angle=math.radians(2.5)
    fill=bpy.data.objects.get('Open sky fill');fill.data.energy=1450;fill.data.color=(1,.86,.69)
    if 'Landscape / distant coast' not in bpy.data.objects:
        mat=bpy.data.materials.new('Atmospheric distant coast');mat.diffuse_color=(.27,.39,.46,1);mat.use_nodes=True
        shader=mat.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(.27,.39,.46,1);shader.inputs['Roughness'].default_value=1
        vertices=[];faces=[]
        for row in range(9):
            for i in range(100):
                x=-240+i*6;y=190+row*9
                ridge=4+10*math.sin(i*.07)**2+9*math.sin(i*.21+.7)**2
                z=max(0,ridge*math.sin(math.pi*row/8))
                vertices.append((x,y,z))
        for row in range(8):
            for i in range(99):
                k=row*100+i;faces.append((k,k+1,k+101,k+100))
        data=bpy.data.meshes.new('Distant coastline ridge');data.from_pydata(vertices,[],faces);data.update()
        obj=bpy.data.objects.new('Landscape / distant coast',data);scene.collection.objects.link(obj);data.materials.append(mat)
    coast=bpy.data.objects['Landscape / distant coast']
    for polygon in coast.data.polygons:polygon.use_smooth=True
    if not coast.modifiers.get('Soft distant terrain'):
        mod=coast.modifiers.new('Soft distant terrain','SUBSURF');mod.levels=2;mod.render_levels=2
    if 'Clouds / broad daylight' not in bpy.data.objects:
        data=bpy.data.lights.new('Clouds / broad daylight','AREA')
        data.energy=35000;data.shape='DISK';data.size=65;data.color=(1,.95,.87)
        obj=bpy.data.objects.new('Clouds / broad daylight',data);scene.collection.objects.link(obj)
        obj.location=(-12,31,48)
        obj.rotation_euler=(Vector((10,75,27))-obj.location).to_track_quat('-Z','Y').to_euler()

def aim(camera,target):camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()

if __name__=='__main__':
    bpy.ops.wm.open_mainfile(filepath=str(OUT/'harbor-refined-v2.blend'))
    scene=bpy.context.scene
    finish(scene)
    prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
    for d in prefs.devices:d.use=d.type=='OPTIX'
    scene.cycles.device='GPU';scene.cycles.samples=64
    camera=scene.camera;camera.location=(-3,-30,5.4);camera.data.lens=30;aim(camera,(3,10,8))
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'harbor-refined-v2.blend'))
    scene.render.filepath=str(OUT/'view-a.png');bpy.ops.render.render(write_still=True)
    camera.location=(-8,-26,6.8);aim(camera,(6,10,8))
    scene.render.filepath=str(OUT/'view-b.png');bpy.ops.render.render(write_still=True)
    camera.location=(1,-9,4.6);camera.data.lens=38;aim(camera,(11,4,4.7))
    scene.render.filepath=str(OUT/'detail-loggia.png');bpy.ops.render.render(write_still=True)
