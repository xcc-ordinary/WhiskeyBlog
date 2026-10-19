"""A real, independently shaded harbor study. No image planes or camera-projected materials.

Blender 5.2 / Cycles: build editable geometry and render two viewpoints.
"""
import bpy
import math
import random
import json
import os
from pathlib import Path
from mathutils import Vector

random.seed(31)
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / os.environ.get('HARBOR_OUTPUT', 'design/harbor-volumetric')
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene

def material(name, color, rough=.6, metal=0, grain=.03):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color,1)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    if grain:
        coord=nodes.new('ShaderNodeTexCoord')
        noise=nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value=32
        noise.inputs['Detail'].default_value=3
        mat.node_tree.links.new(coord.outputs['Object'],noise.inputs['Vector'])
        bump=nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value=.22
        bump.inputs['Distance'].default_value=grain
        mat.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height'])
        mat.node_tree.links.new(bump.outputs['Normal'],bsdf.inputs['Normal'])
        ramp=nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].position=.15
        ramp.color_ramp.elements[0].color=(*(c*.55 for c in color),1)
        ramp.color_ramp.elements[1].position=.85
        ramp.color_ramp.elements[1].color=(*(min(1,c*1.06) for c in color),1)
        mat.node_tree.links.new(noise.outputs['Fac'],ramp.inputs['Fac'])
        weather=nodes.new('ShaderNodeTexNoise')
        weather.inputs['Scale'].default_value=.9
        weather.inputs['Detail'].default_value=4
        mat.node_tree.links.new(coord.outputs['Object'],weather.inputs['Vector'])
        mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY'
        mix.inputs[0].default_value=.32
        mat.node_tree.links.new(ramp.outputs['Color'],mix.inputs[1])
        mat.node_tree.links.new(weather.outputs['Fac'],mix.inputs[2])
        mat.node_tree.links.new(mix.outputs[0],bsdf.inputs['Base Color'])
    return mat

limestone=material('Warm cut limestone',(.72,.62,.44),.84,grain=.024)
ivory=material('Ivory lime plaster',(.86,.79,.61),.9,grain=.016)
sand=material('Sandstone',(.59,.44,.29),.88,grain=.035)
teal=material('Weathered copper roof',(.035,.13,.135),.72,.18,.018)
clay=material('Ochre fired tiles',(.43,.16,.075),.8,grain=.026)
brass=material('Aged brass edges',(.53,.34,.12),.42,.72,.009)
dark=material('Deep window recess',(.025,.055,.06),.3,.22,.0)
wood=material('Salt-worn oak',(.12,.065,.026),.86,grain=.028)
canvas=material('Woven ivory sail',(.9,.86,.69),.91,grain=.005)
rope=material('Hemp rigging',(.37,.28,.16),.94,grain=.007)
leaf=material('Olive foliage',(.09,.16,.035),.83,grain=.002)

def mesh(name,vertices,faces,mat):
    data=bpy.data.meshes.new(name)
    data.from_pydata(vertices,[],faces)
    data.update()
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    data.materials.append(mat)
    return obj

def box(name,loc,size,mat,bevel=.025):
    x,y,z=[value/2 for value in size]
    obj=mesh(name,[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),
                   (-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],
             [(3,2,1,0),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)],mat)
    obj.location=loc
    if bevel:
        mod=obj.modifiers.new('Crafted stone edges','BEVEL')
        mod.width=bevel
        mod.segments=2
    return obj

def cylinder(name,loc,radius,depth,mat,vertices=16):
    points=[(radius*math.cos(i*math.tau/vertices),radius*math.sin(i*math.tau/vertices),z)
            for z in (-depth/2,depth/2) for i in range(vertices)]
    faces=[tuple(range(vertices-1,-1,-1)),tuple(range(vertices,vertices*2))]
    faces += [(i,(i+1)%vertices,(i+1)%vertices+vertices,i+vertices) for i in range(vertices)]
    obj=mesh(name,points,faces,mat)
    obj.location=loc
    bevel=obj.modifiers.new('Edge catchlight','BEVEL')
    bevel.width=min(radius*.1,.025)
    bevel.segments=2
    for polygon in obj.data.polygons:
        polygon.use_smooth=len(polygon.vertices)==4
    return obj

def beam(name,a,b,radius,mat):
    va,vb=Vector(a),Vector(b)
    obj=cylinder(name,(va+vb)*.5,radius,(vb-va).length,mat,10)
    obj.rotation_euler=(vb-va).to_track_quat('Z','Y').to_euler()
    return obj

def curve(name,points,mat,radius=.025):
    data=bpy.data.curves.new(name,'CURVE')
    data.dimensions='3D'
    data.resolution_u=1
    data.bevel_depth=radius
    data.bevel_resolution=2
    spline=data.splines.new('POLY')
    spline.points.add(len(points)-1)
    for p,co in zip(spline.points,points):
        p.co=(*co,1)
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    data.materials.append(mat)
    return obj

def arch(name,x,y,z,width,height,mat,glass=False):
    # True stone voussoir ring with thickness and an open center.
    radius=width/2
    spring=z+height-radius
    if glass:
        pts=[(x-radius,y,z),(x+radius,y,z)]
        pts += [(x+radius*math.cos(a),y,spring+radius*math.sin(a)) for a in [math.pi*i/20 for i in range(21)]]
        mesh(name+' / recessed glass',pts,[tuple(range(len(pts)))],dark)
    vertices=[]
    for depth in (y-.11,y+.11):
        for r in (radius,radius+.14):
            vertices += [(x+r*math.cos(math.pi*i/20),depth,spring+r*math.sin(math.pi*i/20)) for i in range(21)]
    faces=[]
    for i in range(20):
        faces.extend([(i,i+1,22+i,21+i),(42+i,63+i,64+i,43+i),
                      (i,42+i,43+i,i+1),(21+i,22+i,64+i,63+i)])
    mesh(name+' / carved arch',vertices,faces,mat)
    for side in (-1,1):
        box(name+' / jamb',(x+side*(radius+.07),y,(z+spring)/2),(.14,.25,spring-z),mat,.017)
        box(name+' / capital',(x+side*(radius+.07),y,spring),(.27,.35,.12),mat,.015)
    if glass:
        box(name+' / mullion',(x,y-.03,z+height*.42),(.052,.075,height*.84),brass,.008)
        box(name+' / transom',(x,y-.03,z+height*.43),(width,.075,.052),brass,.008)
        box(name+' / sill',(x,y-.02,z-.03),(width+.33,.43,.12),mat,.025)

def roof(name,x,y,z,w,d,rise,mat):
    vertices=[(x-w/2,y-d/2,z),(x+w/2,y-d/2,z),(x+w/2,y+d/2,z),(x-w/2,y+d/2,z),
              (x,y-d/2,z+rise),(x,y+d/2,z+rise)]
    obj=mesh(name,vertices,[(0,1,4),(3,5,2),(0,4,5,3),(4,1,2,5),(0,3,2,1)],mat)
    bevel=obj.modifiers.new('Roof thickness','BEVEL');bevel.width=.045;bevel.segments=2
    beam(name+' / ridge',(x,y-d/2-.04,z+rise+.025),(x,y+d/2+.04,z+rise+.025),.055,brass)
    for i in range(1,9):
        yy=y-d/2+d*i/9
        beam(name+' / left standing seam',(x-w/2,yy,z+.027),(x,yy,z+rise+.027),.014,mat)
        beam(name+' / right standing seam',(x+w/2,yy,z+.027),(x,yy,z+rise+.027),.014,mat)
    return obj

def house(name,x,y,z,w,d,h,mat=ivory,roofmat=clay):
    box(name+' / walls',(x,y,z+h/2),(w,d,h),mat,.055)
    box(name+' / plinth',(x,y,z+.14),(w+.2,d+.2,.28),limestone,.025)
    box(name+' / cornice',(x,y,z+h-.06),(w+.23,d+.23,.20),limestone,.035)
    floors=max(1,int(h/2))
    cols=max(2,int(w/1.25))
    for floor in range(floors):
        for col in range(cols):
            xx=x-w/2+w*(col+.5)/cols
            zz=z+.4+floor*(h-.55)/floors
            arch(name+f' / window {floor}-{col}',xx,y-d/2-.025,zz,min(.62,w/cols*.59),1.19,limestone,True)
    # A second facade has real relief and appears when the camera moves.
    for floor in range(floors):
        for j in range(max(2,int(d/1.4))):
            yy=y-d/2+d*(j+.5)/max(2,int(d/1.4))
            zz=z+.95+floor*(h-.55)/floors
            box(name+' / side glass',(x-w/2-.025,yy,zz),(.05,.54,.86),dark,.014)
            for sign in (-1,1):
                box(name+' / side stone frame',(x-w/2-.07,yy+sign*.31,zz),(.16,.10,1.07),limestone,.02)
            box(name+' / side sill',(x-w/2-.12,yy,zz-.52),(.32,.78,.1),limestone,.02)
    roof(name+' / pitched roof',x,y,z+h,w+.48,d+.45,w*.31,roofmat)
    box(name+' / chimney',(x+w*.26,y+d*.21,z+h+.65),(.32,.4,1.15),sand,.035)

# The land and retaining quay have geometry all the way around, including the shoreline.
box('City / land mass',(18,82,.20),(33,152,1.9),sand,.18)
box('City / quay stone lip',(18,5.95,1.2),(33,.8,.34),limestone,.065)
for i in range(33):
    box('Quay / ashlar course',(2+i,5.38,.34),(.94,.26,.54),limestone,.035)
    box('Quay / lower ashlar',(1.5+i,5.38,-.25),(.94,.26,.54),sand,.035)

# Terraces rise away from the water; houses are full solids with individual facades.
for row in range(3):
    yy=11+row*6.3
    z=1.25+row*1.25
    box('City / terrace retaining wall',(18,yy+1.8,z-.5),(31,6,1.0),sand,.06)
    for i in range(7):
        xx=3.5+i*4.25+row*.15
        w=random.uniform(2.8,3.6)
        h=random.uniform(3.4,6.3)
        house(f'Terrace {row+1} / house {i+1}',xx,yy,z,w,4.4,h,
              random.choice([ivory,limestone]),teal if (i+row)%3==0 else clay)

# The waterfront loggia is open on the ground floor: pillars cast genuine shadows.
for x in (5,8,11,14,17):
    box('Loggia / square pier',(x,4,2.5),(.48,.56,3.3),limestone,.045)
    box('Loggia / rear pier',(x,8,2.5),(.48,.56,3.3),limestone,.045)
    box('Loggia / pier foot',(x,4,1.0),(.75,.78,.22),limestone,.035)
for i in range(4):
    arch(f'Loggia / open bay {i+1}',6.5+i*3,4,1.2,2.38,3.2,limestone)
box('Loggia / upper floor',(11,6,4.1),(12.6,4.8,.38),limestone,.055)
box('Loggia / upper walls',(11,6,5.65),(12.1,4.25,2.8),ivory,.05)
for i in range(9):
    arch(f'Loggia / upper window {i+1}',5.6+i*1.35,3.83,4.55,.74,1.7,limestone,True)
box('Loggia / eaves',(11,6,7.05),(12.7,4.9,.24),limestone,.05)
mesh('Loggia / long hipped copper roof',[(4.4,3.45,7.13),(17.6,3.45,7.13),(17.6,8.55,7.13),(4.4,8.55,7.13),
    (7,6,8.7),(15,6,8.7)],[(0,1,5,4),(1,2,5),(2,3,4,5),(3,0,4)],teal)
beam('Loggia / roof ridge',(7,6,8.74),(15,6,8.74),.055,brass)
for i in range(22):
    xx=4.6+i*.58
    targetx=max(7,min(15,xx))
    beam('Loggia / copper standing seam',(xx,3.44,7.16),(targetx,6,8.73),.015,brass)
for i in range(36):
    xx=4.85+i*.35
    box('Loggia / carved cornice bracket',(xx,3.58,6.95),(.12,.34,.33),limestone,.025)
for i in range(60):
    xx=4.5+i*.22
    cylinder('Loggia / terrace baluster',(xx,3.52,4.43),.035,.55,limestone,10)
box('Loggia / terrace balustrade',(11,3.52,4.76),(13.3,.20,.12),limestone,.028)

# A real bell tower with recessed clock, open belfry, octagonal spire and metal seams.
tx,ty=20,13
box('Campanile / base',(tx,ty,2.15),(3.7,3.7,2),limestone,.09)
box('Campanile / shaft',(tx,ty,8.3),(2.9,2.9,10.4),ivory,.07)
for h in (4,8,12.8):
    box('Campanile / string course',(tx,ty,h),(3.15,3.15,.2),limestone,.04)
for zz in (4.4,7.5,10.4):
    arch('Campanile / shaft lancet',tx,ty-1.48,zz,.69,1.8,limestone,True)
for sx in (-1,1):
    for sy in (-1,1):
        box('Campanile / belfry pier',(tx+sx*1.15,ty+sy*1.15,14.3),(.36,.36,2.7),limestone,.04)
arch('Campanile / open belfry',tx,ty-1.15,13.1,1.89,2.5,limestone)
box('Campanile / belfry cornice',(tx,ty,15.8),(3.3,3.3,.35),limestone,.05)
bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=2.02,radius2=.06,depth=4.8,location=(tx,ty,18.38))
obj=bpy.context.object;obj.name='Campanile / eight-sided copper spire';obj.data.materials.append(teal)
for i in range(8):
    a=i*math.tau/8
    beam('Campanile / raised spire seam',(tx+2.02*math.cos(a),ty+2.02*math.sin(a),15.98),(tx,ty,20.85),.024,brass)
beam('Campanile / finial',(tx,ty,20.6),(tx,ty,22.0),.035,brass)

# Copper dome with individually modeled curved seams.
house('Customs house',27,8,1.25,6,6,6.0,ivory,teal)
vertices=[]
segments,rings=48,20
for j in range(rings+1):
    a=math.pi/2*j/rings
    for i in range(segments):
        b=math.tau*i/segments
        vertices.append((27+2.25*math.cos(a)*math.cos(b),8+2.25*math.cos(a)*math.sin(b),8.9+2.5*math.sin(a)))
faces=[]
for j in range(rings):
    for i in range(segments):
        ni=(i+1)%segments
        faces.append((j*segments+i,j*segments+ni,(j+1)*segments+ni,(j+1)*segments+i))
obj=mesh('Customs house / copper dome',vertices,faces,teal)
for poly in obj.data.polygons: poly.use_smooth=True
for i in range(12):
    b=math.tau*i/12
    points=[(27+2.27*math.cos(a)*math.cos(b),8+2.27*math.cos(a)*math.sin(b),8.9+2.53*math.sin(a)) for a in [math.pi/2*j/24 for j in range(25)]]
    curve('Customs house / dome seam',points,brass,.024)
cylinder('Customs house / lantern',(27,8,11.6),.38,.70,brass,16)

# Foreground pier: separate boards, piles, cross braces, mooring hardware and rope.
for i in range(40):
    yy=-7+i*.32
    board=box('Pier / oak board',(15,yy,1.05),(9,.30,.18),wood,.025)
    board.rotation_euler.z=random.uniform(-.004,.004)
for x in (11.1,18.9):
    for yy in (-6,-2,2,5):
        cylinder('Pier / timber pile',(x,yy,.04),.24,2.7,wood,14)
        cylinder('Pier / pile cap',(x,yy,1.49),.30,.12,wood,14)
        beam('Pier / cross brace',(x,yy-.7,-.45),(x,yy+.7,1.0),.105,wood)
for yy in (-5,0,4):
    cylinder('Pier / mooring bollard',(11.4,yy,1.35),.13,.44,brass,14)
    curve('Pier / hanging mooring rope',[(11.4,yy,1.55),(10.9,yy-.4,1.15),(10.6,yy-.5,.65),(10.7,yy-.2,.34),(11.0,yy,.69)],rope,.035)

def boat(name,x,y,scale=1):
    root=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(root)
    start=set(bpy.data.objects)
    # Hull rings create curved sides, a keel, a pointed bow and a transom.
    vertices=[]
    n=24
    for ring in range(5):
        z=-.33+ring*.22
        factor=math.sin((ring+1)/5*math.pi/2)
        for i in range(n):
            a=math.tau*i/n
            vertices.append((math.sin(a)*.75*factor,math.cos(a)*2.2,z))
    faces=[]
    for ring in range(4):
        for i in range(n):
            faces.append((ring*n+i,ring*n+(i+1)%n,(ring+1)*n+(i+1)%n,(ring+1)*n+i))
    faces += [tuple(range(n-1,-1,-1))]
    hull=mesh(name+' / curved hull',vertices,faces,wood)
    for polygon in hull.data.polygons: polygon.use_smooth=True
    box(name+' / deck',(0,0,.50),(1.31,3.55,.10),wood,.055)
    for i in range(9):
        box(name+' / deck plank',(-.58+i*.145,0,.563),(.132,3.3,.021),canvas,.003)
    beam(name+' / mast',(0,0,.55),(0,0,7.5),.065,wood)
    beam(name+' / boom',(0,0,1.3),(0,-2.45,1.3),.055,wood)
    # Sail mesh has physical billow, thickness and woven procedural material.
    vertices=[]
    steps=20
    for row in range(steps+1):
        t=row/steps
        span=2.45*(1-t)
        for col in range(steps+1):
            s=col/steps
            vertices.append((.34*math.sin(math.pi*s)*math.sin(math.pi*t),-span*s,1.32+6.0*t))
    faces=[]
    for row in range(steps):
        for col in range(steps):
            k=row*(steps+1)+col
            faces.append((k,k+1,k+steps+2,k+steps+1))
    sail=mesh(name+' / billowing sail',vertices,faces,canvas)
    mod=sail.modifiers.new('Canvas thickness','SOLIDIFY');mod.thickness=.012
    for polygon in sail.data.polygons: polygon.use_smooth=True
    for i in range(1,7):
        t=i/7;span=2.45*(1-t)
        curve(name+' / sail stitching',[(.345*math.sin(math.pi*j/20)*math.sin(math.pi*t),-span*j/20,1.32+6*t) for j in range(21)],canvas,.008)
    for a,b in [((0,0,7.35),(-.7,1.5,.60)),((0,0,7.35),(.7,1.5,.60)),((0,0,7.35),(0,-2.4,1.3))]:
        beam(name+' / rigging',a,b,.013,rope)
    for obj in set(bpy.data.objects)-start:
        obj.parent=root
    root.location=(x,y,.15)
    root.scale=(scale,scale,scale)
    root.rotation_euler.z=math.radians(-19)
    return root

boat('Foreground yacht',8,-6,1.0)
boat('Harbor yacht',-2,5,.64)
boat('Distant yacht',-12,17,.44)

# Far city is real geometry as well, with increasingly narrow streets and taller silhouettes.
for row in range(3):
    for i in range(10):
        house(f'Inland {row} / house {i}',3.0+i*3.2,35+row*6.0,3.7+row*.5,
              random.uniform(2.3,2.8),4,random.uniform(4.5,8.3),limestone,clay)

def tree(name,x,y,z):
    beam(name+' / trunk',(x,y,z),(x+.12,y,z+3.8),.13,wood)
    for i in range(5):
        a=i*math.tau/5
        beam(name+' / branch',(x,y,z+2.2),(x+1.4*math.cos(a),y+1.4*math.sin(a),z+3.7),.04,wood)
    vertices=[];faces=[]
    for i in range(1300):
        a=random.random()*math.tau
        h=random.uniform(-1,1)
        r=random.random()**.33
        p=Vector((x+1.9*r*math.sqrt(1-h*h)*math.cos(a),y+1.9*r*math.sqrt(1-h*h)*math.sin(a),z+3.6+1.5*r*h))
        direction=Vector((random.uniform(-1,1),random.uniform(-1,1),random.uniform(-.4,.9))).normalized()
        side=direction.cross(Vector((0,0,1))).normalized()*.047
        length=random.uniform(.09,.16)
        j=len(vertices)
        vertices.extend([p-direction*length,p-side,p+Vector((0,0,.028)),p+side,p+direction*length])
        faces.extend([(j,j+1,j+2),(j,j+2,j+3),(j+1,j+4,j+2),(j+2,j+4,j+3)])
    mesh(name+' / individual leaves',vertices,faces,leaf)
for i,(x,y,z) in enumerate([(2,16,2),(7,20,3),(13,21,3),(25,19,3),(29,26,4),(10,30,4),(18,31,4),(28,33,4),
                            (4,39,4.2),(15,41,4.2),(24,40,4.2),(31,13,1.5)]):
    tree(f'City / olive tree {i}',x,y,z)

for i in range(30):
    yy=7+i*3
    box('Quayside / coping',(1.65,yy,1.3),(.35,2.95,.26),limestone,.055)
    if i%2==0:
        cylinder('Quayside / iron lamp post',(2.1,yy,2.55),.045,2.7,brass,10)
        cylinder('Quayside / lantern',(2.1,yy,4.1),.15,.35,dark,8)

# A real ocean surface and physically shaded water. Noise only supplies subpixel ripples.
water=bpy.data.materials.new('Turquoise seawater / physical waves')
water.use_nodes=True
nodes=water.node_tree.nodes
bsdf=nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value=(.055,.26,.28,1)
bsdf.inputs['Roughness'].default_value=.12
bsdf.inputs['Metallic'].default_value=.12
bsdf.inputs['IOR'].default_value=1.333
bsdf.inputs['Transmission Weight'].default_value=.18
noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=2.4
noise.inputs['Detail'].default_value=4;noise.inputs['Roughness'].default_value=.72
coord=nodes.new('ShaderNodeTexCoord')
water.node_tree.links.new(coord.outputs['Object'],noise.inputs['Vector'])
bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.13
water.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height'])
water.node_tree.links.new(bump.outputs['Normal'],bsdf.inputs['Normal'])
vertices=[];faces=[]
nx,ny=280,230
for j in range(ny+1):
    y=-65+j*.6
    for i in range(nx+1):
        x=-85+i*.6
        edge=max(0,min(1,(x+85)/7,(83-x)/7,(y+65)/7,(73-y)/7))
        z=-.1+edge*(.1+.065*math.sin(x*2.4+y*.8)+.045*math.sin(y*4-x*.6))
        vertices.append((x,y,z))
for j in range(ny):
    for i in range(nx):
        k=j*(nx+1)+i;faces.append((k,k+1,k+nx+2,k+nx+1))
ocean=mesh('Ocean / full volumetric wave mesh',vertices,faces,water)
for poly in ocean.data.polygons: poly.use_smooth=True
mesh('Ocean / distant horizon water',[(-3000,-3000,-.10),(3000,-3000,-.10),(3000,3000,-.10),(-3000,3000,-.10)],[(0,1,2,3)],water)

# Lighting is computed from geometry; the original painting is never loaded.
world=bpy.data.worlds.new('Golden harbor daylight')
world.use_nodes=True
scene.world=world
world.node_tree.nodes.clear()
sky=world.node_tree.nodes.new('ShaderNodeTexSky')
sky.sky_type='MULTIPLE_SCATTERING'
sky.sun_elevation=math.radians(15)
sky.sun_rotation=math.radians(130)
sky.altitude=.1;sky.air_density=1.2;sky.aerosol_density=1.7
background=world.node_tree.nodes.new('ShaderNodeBackground')
background.inputs['Strength'].default_value=.13
world.node_tree.links.new(sky.outputs[0],background.inputs[0])
output=world.node_tree.nodes.new('ShaderNodeOutputWorld')
world.node_tree.links.new(background.outputs[0],output.inputs[0])
bpy.ops.object.light_add(type='SUN',location=(-30,-20,35))
sun=bpy.context.object;sun.name='Golden grazing sunlight';sun.data.energy=1.8
sun.data.angle=math.radians(3);sun.data.color=(1,.79,.51)
sun.rotation_euler=(math.radians(57),math.radians(-20),math.radians(-28))
bpy.ops.object.light_add(type='AREA',location=(-10,-15,23))
fill=bpy.context.object;fill.name='Open sky fill';fill.data.energy=900
fill.data.shape='DISK';fill.data.size=22
fill.rotation_euler=(Vector((12,6,5))-fill.location).to_track_quat('-Z','Y').to_euler()

# Clouds are volumes, kept behind the actual city. No sky texture or billboard.
cloudmat=bpy.data.materials.new('Soft cumulus volume')
cloudmat.use_nodes=True
cloudmat.node_tree.nodes.clear()
out=cloudmat.node_tree.nodes.new('ShaderNodeOutputMaterial')
volume=cloudmat.node_tree.nodes.new('ShaderNodeVolumePrincipled')
volume.inputs['Color'].default_value=(.98,.94,.86,1)
cloudnoise=cloudmat.node_tree.nodes.new('ShaderNodeTexNoise');cloudnoise.inputs['Scale'].default_value=3.8;cloudnoise.inputs['Detail'].default_value=5
cloudcoord=cloudmat.node_tree.nodes.new('ShaderNodeTexCoord')
cloudmat.node_tree.links.new(cloudcoord.outputs['Generated'],cloudnoise.inputs['Vector'])
cloudramp=cloudmat.node_tree.nodes.new('ShaderNodeValToRGB')
cloudramp.color_ramp.elements[0].position=.38;cloudramp.color_ramp.elements[0].color=(0,0,0,1)
cloudramp.color_ramp.elements[1].position=.7;cloudramp.color_ramp.elements[1].color=(.16,.16,.16,1)
cloudmat.node_tree.links.new(cloudnoise.outputs['Fac'],cloudramp.inputs['Fac'])
cloudmat.node_tree.links.new(cloudramp.outputs['Color'],volume.inputs['Density'])
cloudmat.node_tree.links.new(volume.outputs['Volume'],out.inputs['Volume'])
for i in range(18):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=(-35+i*7,65+random.uniform(-6,6),25+random.uniform(-4,12)))
    obj=bpy.context.object;obj.name='Sky / volumetric cloud'
    obj.scale=(random.uniform(6,11),4,random.uniform(3,7));obj.data.materials.append(cloudmat)

bpy.ops.object.camera_add(location=(-3,-30,5.4))
camera=bpy.context.object;camera.name='Hero / main camera';camera.data.lens=30
def aim(obj,target): obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
aim(camera,(3,10,8))
scene.camera=camera
camera.data.clip_end=6000
scene.render.engine='CYCLES'
scene.cycles.samples=48
scene.cycles.use_denoising=True
prefs=bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type='OPTIX';prefs.get_devices()
for device in prefs.devices: device.use=device.type=='OPTIX'
scene.cycles.device='GPU'
scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.view_settings.view_transform='AgX'
scene.view_settings.exposure=-.75
scene.render.film_transparent=False
if not os.environ.get('HARBOR_BUILD_ONLY'):
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'volumetric-harbor.blend'))
    scene.render.filepath=str(OUT/'view-a.png')
    bpy.ops.render.render(write_still=True)
    camera.location=(-8,-26,6.8)
    aim(camera,(6,10,8))
    scene.render.filepath=str(OUT/'view-b.png')
    bpy.ops.render.render(write_still=True)
    print('VOLUMETRIC_HARBOR',json.dumps({'objects':len(scene.objects),'image_textures':sum(n.type=='TEX_IMAGE' for m in bpy.data.materials if m.use_nodes for n in m.node_tree.nodes)}))
