"""Second art-directed modeling pass; preserves the approved real-geometry study.

Run with Blender 5.2 --background --factory-startup --python this-file.
"""
import os
import runpy
import math
import random
import json
from pathlib import Path
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'design/harbor-refined-v2'
OUT.mkdir(parents=True,exist_ok=True)
os.environ['HARBOR_BUILD_ONLY']='1'
os.environ['HARBOR_OUTPUT']='design/harbor-refined-v2'
base=runpy.run_path(str(ROOT/'scripts/build-volumetric-harbor.py'))
for key in ('mesh','box','cylinder','beam','curve','arch','house','roof','material','boat',
            'limestone','ivory','sand','teal','clay','brass','dark','wood','canvas','rope','leaf','water'):
    globals()[key]=base[key]
scene=bpy.context.scene
random.seed(88)

def remove_prefix(prefix):
    for obj in list(scene.objects):
        if obj.name.startswith(prefix): bpy.data.objects.remove(obj,do_unlink=True)

# Add scale-dependent weathering. Grain, pigment variation and roughness are distinct.
for mat in (limestone,ivory,sand,teal,wood):
    nodes=mat.node_tree.nodes;links=mat.node_tree.links
    bsdf=nodes.get('Principled BSDF')
    coord=next(n for n in nodes if n.type=='TEX_COORD')
    weather=nodes.new('ShaderNodeTexNoise');weather.name='Slow erosion / salt deposits'
    weather.inputs['Scale'].default_value=1.7;weather.inputs['Detail'].default_value=5
    links.new(coord.outputs['Object'],weather.inputs['Vector'])
    roughness=nodes.new('ShaderNodeMapRange');roughness.inputs['From Min'].default_value=.2;roughness.inputs['From Max'].default_value=.8
    roughness.inputs['To Min'].default_value=.36 if mat==teal else .64
    roughness.inputs['To Max'].default_value=.82 if mat==teal else .96
    links.new(weather.outputs['Fac'],roughness.inputs['Value']);links.new(roughness.outputs['Result'],bsdf.inputs['Roughness'])
    if mat==teal:
        ramp=nodes.new('ShaderNodeValToRGB');ramp.name='Oxide islands and worn copper'
        ramp.color_ramp.elements[0].position=.18;ramp.color_ramp.elements[0].color=(.042,.065,.063,1)
        ramp.color_ramp.elements[1].position=.8;ramp.color_ramp.elements[1].color=(.047,.27,.255,1)
        ramp.color_ramp.elements.new(.43).color=(.02,.12,.16,1)
        links.new(weather.outputs['Fac'],ramp.inputs['Fac']);links.new(ramp.outputs['Color'],bsdf.inputs['Base Color'])

blueplaster=material('Dusty blue plaster',(.30,.42,.46),.87,grain=.018)
warmplaster=material('Old apricot plaster',(.62,.38,.21),.89,grain=.024)
redtile=material('Deep fired terracotta',(.34,.105,.036),.9,grain=.019)
iron=material('Blue harbor iron',(.025,.10,.15),.56,.48,.012)
algae=material('Damp stone and algae',(.075,.10,.041),.89,grain=.028)
glass=material('Reflective smoked window glass',(.048,.091,.12),.14,.38,0)

def lathe(name,x,y,z,profile,mat,segments=32,flutes=0):
    verts=[];faces=[]
    for zz,radius in profile:
        for i in range(segments):
            a=i*math.tau/segments
            r=radius*(1-.045*(.5+.5*math.cos(a*flutes))) if flutes else radius
            verts.append((x+r*math.cos(a),y+r*math.sin(a),z+zz))
    for j in range(len(profile)-1):
        for i in range(segments):
            ni=(i+1)%segments;k=j*segments
            faces.append((k+i,k+ni,k+ni+segments,k+i+segments))
    faces += [tuple(range(segments-1,-1,-1)),tuple(range((len(profile)-1)*segments,len(profile)*segments))]
    obj=mesh(name,verts,faces,mat)
    for polygon in obj.data.polygons: polygon.use_smooth=len(polygon.vertices)==4
    return obj

def pinnacle(name,x,y,z,h=3,r=.42):
    lathe(name+' / carved base',x,y,z,[(0,r*1.4),(.12,r*1.4),(.19,r),(.64,r),(.72,r*1.25),(.86,r*.9)],limestone,16)
    verts=[(x+r*math.cos(i*math.tau/8),y+r*math.sin(i*math.tau/8),z+.86) for i in range(8)]+[(x,y,z+h)]
    mesh(name+' / metal spire',verts,[(i,(i+1)%8,8) for i in range(8)],teal)
    beam(name+' / finial',(x,y,z+h),(x,y,z+h+.38),.023,brass)

def dormer(name,x,y,z,w=.65):
    box(name+' / cheek',(x,y+.1,z+.34),(w,.52,.68),ivory,.022)
    arch(name+' / window',x,y-.18,z+.04,w*.57,.58,limestone,True)
    roof(name+' / pointed cap',x,y+.08,z+.68,w+.18,.70,.38,teal)

# Fix the structural proportions of the open loggia, then build fluted columns.
remove_prefix('Loggia / open bay')
for i in range(4):
    arch(f'Loggia / fitted stone arch {i}',6.5+i*3,4,1.2,2.38,2.65,limestone)
    radius=1.19;spring=1.2+2.65-radius
    # Mortar lines subdivide the real voussoirs, avoiding a uniform smooth hoop.
    for j in range(13):
        a=j*math.pi/12
        beam('Loggia / voussoir joint',(6.5+i*3+radius*math.cos(a),3.876,spring+radius*math.sin(a)),
             (6.5+i*3+(radius+.14)*math.cos(a),3.876,spring+(radius+.14)*math.sin(a)),.009,sand)
for obj in scene.objects:
    if obj.name.startswith('Loggia / square pier'):
        obj.hide_render=True;obj.hide_viewport=True
for x in (5,8,11,14,17):
    lathe('Loggia / fluted limestone column',x,4,.88,[(0,.34),(.14,.34),(.20,.25),(.30,.24),
          (.38,.205),(2.54,.18),(2.66,.22),(2.75,.28),(2.85,.34),(3.03,.34)],limestone,48,12)
    box('Loggia / column abacus',(x,4,3.94),(.76,.74,.17),limestone,.035)
for i in range(5): dormer('Loggia / roof dormer',6.4+i*2.25,4.48,7.79,.78)
for i in range(9):
    x=5.6+i*1.35
    for side in (-1,1):
        box('Loggia / slender upper pilaster',(x+side*.54,3.79,5.62),(.10,.16,2.09),limestone,.018)
    # Molded pediment rather than a plain window outline.
    beam('Loggia / pediment left',(x-.55,3.72,6.41),(x,3.72,6.72),.045,limestone)
    beam('Loggia / pediment right',(x,3.72,6.72),(x+.55,3.72,6.41),.045,limestone)

# Masonry courses and tide marks at the foreground retain their actual joint shadows.
for row in range(4):
    for i in range(30):
        x=4.55+i*.42+(row%2)*.20
        z=.03+row*.21
        mat=algae if row==0 and i%3 else random.choice([limestone,sand])
        box('Waterfront / dressed stone',(x,3.32,z),(.395,.16,.194),mat,.012)

# The clock tower gains buttresses, a real clock dial, corner pinnacles and louvers.
for sx in (-1,1):
    for sy in (-1,1):
        x=20+sx*1.49;y=13+sy*1.49
        for level in range(4):
            z=2.4+level*2.85
            box('Campanile / stepped buttress',(x,y,z+1.2),(.37-level*.03,.37-level*.03,2.4),limestone,.028)
        pinnacle('Campanile / corner pinnacle',20+sx*1.63,13+sy*1.63,15.93,3.25,.27)
for i in range(11):
    box('Campanile / belfry louver',(20,11.85,13.30+i*.13),(1.47,.16,.075),wood,.012)
clock=cylinder('Campanile / clock dial',(20,11.48,11.8),.64,.075,ivory,64)
clock.rotation_euler.x=math.pi/2
curve('Campanile / clock rim',[(20+.64*math.cos(i*math.tau/64),11.42,11.8+.64*math.sin(i*math.tau/64)) for i in range(65)],brass,.025)
for i in range(12):
    a=i*math.tau/12
    beam('Campanile / clock tick',(20+.49*math.sin(a),11.39,11.8+.49*math.cos(a)),(20+.56*math.sin(a),11.39,11.8+.56*math.cos(a)),.016,brass)
beam('Campanile / minute hand',(20,11.35,11.8),(20+.15,11.35,12.24),.021,iron)
beam('Campanile / hour hand',(20,11.34,11.8),(19.72,11.34,11.99),.026,iron)

# Correct the dome's drum and add its gallery windows and balustrade.
lathe('Customs / dome drum',27,8,8.0,[(0,2.34),(.15,2.34),(.2,2.18),(.68,2.18),(.76,2.36),(.9,2.36)],limestone,64)
for i in range(18):
    a=i*math.tau/18
    lathe('Customs / drum pilaster',27+2.18*math.cos(a),8+2.18*math.sin(a),8.16,[(0,.07),(.56,.07)],ivory,12)
for i in range(36):
    a=i*math.tau/36
    lathe('Customs / parapet baluster',27+3.0*math.cos(a),8+3.0*math.sin(a),7.45,[(0,.04),(.39,.045)],limestone,10)
curve('Customs / parapet handrail',[(27+3.0*math.cos(i*math.tau/72),8+3.0*math.sin(i*math.tau/72),7.9) for i in range(73)],limestone,.07)

# A cathedral and several narrow spires make the skyline read as a layered city.
house('Upper city / cathedral nave',22,27,5.0,6.4,11.0,9.0,limestone,teal)
for x,y,h in [(18.6,23,20.0),(25.4,23,24.5),(14.4,31,16.0),(29.5,35,19.0),(8.5,40,13.7)]:
    width=1.7 if h>18 else 1.4
    box('Skyline / carved tower shaft',(x,y,4+h*.5),(width,width,h),ivory,.045)
    for level in range(3):
        z=5.8+level*(h-4)/3
        arch('Skyline / narrow lancet',x,y-width/2-.03,z,.52,2.30,limestone,True)
        box('Skyline / string course',(x,y,z-.23),(width+.26,width+.26,.14),limestone,.026)
    pinnacle('Skyline / main spire',x,y,4+h,4.1 if h>18 else 3.0,width*.56)
    for side in (-1,1):
        pinnacle('Skyline / shoulder spire',x+side*width*.66,y,4+h-.80,2.35,.17)

# Raised, staggered blocks reveal more rooftops and reduce the repeating village silhouette.
for row in range(4):
    y=54+row*7
    ground=6+row*1.6
    box('Upper city / terrace',(18,y+2,ground-.5),(30,6.8,1.2),sand,.09)
    for col in range(8):
        x=3.8+col*3.6+random.uniform(-.22,.22)
        h=random.uniform(5.0,10.5)
        house(f'Upper city / block {row}-{col}',x,y+random.uniform(-.6,.6),ground,random.uniform(2.2,3.1),4.2,h,
              random.choice([ivory,limestone,blueplaster,warmplaster]),random.choice([teal,clay,redtile]))

# Individual tile courses, dormers, shutters and wrought-iron balconies in the near city.
for obj in list(scene.objects):
    if '/ walls' not in obj.name or not obj.name.startswith('Terrace '): continue
    x,y,z=obj.location;w,d,h=obj.dimensions
    bottom=z-h/2
    for yy in (y-d/2,y+d/2):
        box('Terrace / gutter',(x,yy,z+h/2-.11),(w+.3,.13,.13),iron,.018)
    for floor in range(max(1,int(h/2))):
        zz=bottom+.54+floor*(h-.55)/max(1,int(h/2))
        for col in range(max(2,int(w/1.25))):
            xx=x-w/2+w*(col+.5)/max(2,int(w/1.25))
            if (col+floor)%3==0:
                box('Terrace / balcony floor',(xx,y-d/2-.34,zz-.16),(.94,.75,.13),limestone,.028)
                for k in range(7):
                    beam('Terrace / balcony iron bar',(xx-.42+k*.14,y-d/2-.65,zz-.10),(xx-.42+k*.14,y-d/2-.65,zz+.49),.017,iron)
                beam('Terrace / balcony rail',(xx-.46,y-d/2-.65,zz+.51),(xx+.46,y-d/2-.65,zz+.51),.028,iron)
            else:
                for side in (-1,1):
                    box('Terrace / wooden shutter',(xx+side*.44,y-d/2-.12,zz+.46),(.24,.12,.95),teal,.017)
                    for k in range(6): box('Terrace / shutter slat',(xx+side*.44,y-d/2-.19,zz+.10+k*.14),(.21,.032,.027),iron,.006)
    if w>3: dormer('Terrace / roof dormer',x,y-d*.26,bottom+h+.24,.65)

# Handled port cranes bring back the harbor's mechanical detail without an airship.
def crane(name,x,y,z):
    cylinder(name+' / rotating base',(x,y,z+.5),.70,1,iron,24)
    a=Vector((x,y,z+.8));b=Vector((x-.8,y,z+7.5));c=Vector((x-4.8,y-2.7,z+9.0))
    for side in (-1,1):
        off=Vector((0,side*.3,0))
        beam(name+' / tower member',a+off,b+off,.07,iron)
        beam(name+' / boom chord',b+off,c+off,.06,iron)
    for i in range(9):
        p=a.lerp(b,i/9);q=a.lerp(b,(i+1)/9)
        beam(name+' / tower lattice',p+Vector((0,-.3,0)),q+Vector((0,.3,0)),.026,iron)
    for i in range(8):
        p=b.lerp(c,i/8);q=b.lerp(c,(i+1)/8)
        beam(name+' / boom lattice',p+Vector((0,-.3,0)),q+Vector((0,.3,0)),.024,iron)
    beam(name+' / hanging cable',c,c-Vector((0,0,6.2)),.014,rope)
    curve(name+' / hook',[(c.x,c.y,c.z-6.2),(c.x+.13,c.y,c.z-6.44),(c.x+.32,c.y,c.z-6.48),(c.x+.36,c.y,c.z-6.28)],iron,.04)
    beam(name+' / stay',a+Vector((.9,0,3.5)),c,.018,rope)
crane('Port / crane west',3.1,11,1.35)
crane('Port / crane east',9.2,18,2.5)

# Pier hardware, uneven plank ends and coiled rope are actual mesh/curve details.
for i in range(40):
    yy=-7+i*.32
    for x in (11.18,18.82):
        cylinder('Pier / recessed iron bolt',(x,yy,1.148),.025,.009,iron,10)
for i in range(4):
    x=12+i*1.35;y=-4.7+random.uniform(-.3,.3)
    curve('Pier / coiled rope',[(x+(.22+.014*j)*math.cos(j*.40),y+(.22+.014*j)*math.sin(j*.40),1.19+.004*j) for j in range(65)],rope,.026)
for x,y in [(17,-3),(18,-2.3),(16,1.4)]:
    lathe('Pier / oak barrel',x,y,1.15,[(0,.27),(.1,.32),(.45,.38),(.80,.32),(.89,.28)],wood,32)
    for z,r in [(1.32,.34),(1.87,.34)]:
        curve('Pier / barrel hoop',[(x+r*math.cos(i*math.tau/40),y+r*math.sin(i*math.tau/40),z) for i in range(41)],iron,.026)

# Finer yacht detail follows the ship root, including actual billowing jib and rail stanchions.
root=bpy.data.objects.get('Foreground yacht')
before=set(scene.objects)
verts=[];faces=[]
for j in range(17):
    t=j/16
    for i in range(17):
        u=i/16
        verts.append((-.20*math.sin(math.pi*u)*math.sin(math.pi*t),2.0*u*(1-t),1.08+5.8*t))
for j in range(16):
    for i in range(16):
        k=j*17+i;faces.append((k,k+1,k+18,k+17))
jib=mesh('Foreground yacht / curved foresail',verts,faces,canvas)
mod=jib.modifiers.new('Woven sail thickness','SOLIDIFY');mod.thickness=.009
for p in jib.data.polygons:p.use_smooth=True
for side in (-1,1):
    for yy in (-1.3,-.5,.3,1.1): beam('Foreground yacht / rail stanchion',(side*.64,yy,.58),(side*.64,yy,.99),.015,brass)
    curve('Foreground yacht / guard rope',[(side*.64,yy,.97) for yy in (-1.3,-.5,.3,1.1)],rope,.012)
for obj in set(scene.objects)-before: obj.parent=root

# Replace the visibly finite wave patch; the fine field extends beyond the framing.
ocean=bpy.data.objects.get('Ocean / full volumetric wave mesh')
old=ocean.data
verts=[];faces=[];nx=500;ny=520
for j in range(ny+1):
    y=-65+j*.8
    for i in range(nx+1):
        x=-170+i*.8
        fade=max(0,min(1,(x+170)/24,(230-x)/24,(y+65)/24,(351-y)/24))
        z=-.1+fade*(.1+.038*math.sin(x*1.37+y*.55)+.022*math.sin(y*2.2-x*.43))
        verts.append((x,y,z))
for j in range(ny):
    for i in range(nx):
        k=j*(nx+1)+i;faces.append((k,k+1,k+nx+2,k+nx+1))
data=bpy.data.meshes.new('Ocean / continuous broad wave field');data.from_pydata(verts,[],faces);data.update();data.materials.append(water)
ocean.data=data;bpy.data.meshes.remove(old)
for p in data.polygons:p.use_smooth=True
wbsdf=water.node_tree.nodes.get('Principled BSDF')
wbsdf.inputs['Base Color'].default_value=(.022,.21,.24,1)
wbsdf.inputs['Roughness'].default_value=.085;wbsdf.inputs['Metallic'].default_value=0
wbsdf.inputs['Transmission Weight'].default_value=.30

# Cumulus clusters have soft radial falloff, detailed density, and sunlit volumetric edges.
remove_prefix('Sky / volumetric cloud')
cloud=bpy.data.materials.new('Cumulus / layered density and soft boundary');cloud.use_nodes=True
nodes=cloud.node_tree.nodes;nodes.clear();links=cloud.node_tree.links
coord=nodes.new('ShaderNodeTexCoord')
noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=5;noise.inputs['Detail'].default_value=5
links.new(coord.outputs['Generated'],noise.inputs['Vector'])
noise_ramp=nodes.new('ShaderNodeValToRGB');noise_ramp.color_ramp.elements[0].position=.25;noise_ramp.color_ramp.elements[0].color=(.008,.008,.008,1)
noise_ramp.color_ramp.elements[1].position=.73;noise_ramp.color_ramp.elements[1].color=(.30,.30,.30,1)
links.new(noise.outputs['Fac'],noise_ramp.inputs['Fac'])
center=nodes.new('ShaderNodeVectorMath');center.operation='SUBTRACT';center.inputs[1].default_value=(.5,.5,.5)
links.new(coord.outputs['Generated'],center.inputs[0])
length=nodes.new('ShaderNodeVectorMath');length.operation='LENGTH';links.new(center.outputs['Vector'],length.inputs[0])
falloff=nodes.new('ShaderNodeMapRange');falloff.clamp=True;falloff.inputs['From Min'].default_value=.18;falloff.inputs['From Max'].default_value=.5
falloff.inputs['To Min'].default_value=1;falloff.inputs['To Max'].default_value=0;links.new(length.outputs['Value'],falloff.inputs['Value'])
mult=nodes.new('ShaderNodeMath');mult.operation='MULTIPLY';links.new(noise_ramp.outputs['Color'],mult.inputs[0]);links.new(falloff.outputs['Result'],mult.inputs[1])
volume=nodes.new('ShaderNodeVolumePrincipled');volume.inputs['Color'].default_value=(1,.975,.91,1);volume.inputs['Anisotropy'].default_value=.22
links.new(mult.outputs[0],volume.inputs['Density']);out=nodes.new('ShaderNodeOutputMaterial');links.new(volume.outputs[0],out.inputs['Volume'])
for bank in range(8):
    x=-37+bank*11;y=75+random.uniform(-9,9);z=21+bank*.9
    for lump in range(5):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=(x+random.uniform(-5,5),y+random.uniform(-4,4),z+random.uniform(-4,9)))
        obj=bpy.context.object;obj.name='Sky / refined cumulus'
        obj.scale=(random.uniform(7,11),random.uniform(5,9),random.uniform(5,10));obj.data.materials.append(cloud)

# Golden low-angle light, cooler skylight, and subtle atmospheric separation.
sky=next(n for n in scene.world.node_tree.nodes if n.type=='TEX_SKY')
sky.sun_elevation=math.radians(13);sky.sun_rotation=math.radians(108);sky.aerosol_density=1.5
bg=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs['Strength'].default_value=.24
sun=bpy.data.objects.get('Golden grazing sunlight');sun.data.energy=2.2;sun.data.color=(1,.83,.58)
sun.rotation_euler=(math.radians(66),math.radians(-22),math.radians(-30));sun.data.angle=math.radians(2.0)
fill=bpy.data.objects.get('Open sky fill');fill.data.color=(.63,.77,1);fill.data.energy=750
scene.view_settings.exposure=-.25
scene.cycles.samples=96;scene.cycles.use_denoising=True
scene.render.resolution_x=1600;scene.render.resolution_y=1000
scene.render.resolution_percentage=100
camera=scene.camera;camera.location=(-3,-30,5.4);base['aim'](camera,(3,10,8))

# Keep a searchable collection structure in the editable source.
groups={}
for obj in list(scene.objects):
    key=obj.name.split(' / ')[0]
    if key not in groups:
        col=bpy.data.collections.new(key);scene.collection.children.link(col);groups[key]=col
    for col in list(obj.users_collection):col.objects.unlink(obj)
    groups[key].objects.link(obj)
scene['revision']='v2 / layered skyline, architectural details and physical materials'
scene['image_texture_count']=sum(n.type=='TEX_IMAGE' for m in bpy.data.materials if m.use_nodes for n in m.node_tree.nodes)
runpy.run_path(str(ROOT/'scripts/finish-harbor-v2.py'))['finish'](scene)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'harbor-refined-v2.blend'))
scene.render.filepath=str(OUT/'view-a.png');bpy.ops.render.render(write_still=True)
camera.location=(-8,-26,6.8);base['aim'](camera,(6,10,8))
scene.render.filepath=str(OUT/'view-b.png');bpy.ops.render.render(write_still=True)
camera.location=(1,-9,4.6);camera.data.lens=38;base['aim'](camera,(11,4,4.7))
scene.render.filepath=str(OUT/'detail-loggia.png');bpy.ops.render.render(write_still=True)
(OUT/'scene-stats.json').write_text(json.dumps({'objects':len(scene.objects),'mesh_polygons':sum(len(o.data.polygons) for o in scene.objects if o.type=='MESH'),'image_textures':scene['image_texture_count']},indent=2),encoding='utf-8')
print('REFINED_HARBOR_COMPLETE',OUT)
