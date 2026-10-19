"""Export the refined physical harbor as a small, material-batched browser mesh."""
import bpy
from pathlib import Path
from collections import defaultdict
from mathutils import Matrix

ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'design/harbor-refined-v2/harbor-refined-v2.blend'))
scene=bpy.context.scene
groups=defaultdict(list)
# Skip the broad ocean, volume clouds and foliage; the browser draws these procedurally.
for obj in list(scene.objects):
    if obj.hide_render or obj.type not in ('MESH','CURVE'):continue
    if obj.name.startswith(('Ocean /','Sky /')):continue
    if 'individual leaves' in obj.name:continue
    if not obj.data.materials:continue
    groups[obj.data.materials[0].name].append(obj)
depsgraph=bpy.context.evaluated_depsgraph_get()
exports=[]
for name,objects in groups.items():
    vertices=[];faces=[]
    for obj in objects:
        # Preserve modeled profiles and curve bevels; primitive bevel modifiers are
        # unnecessary at web framing and would multiply vertex count dramatically.
        if obj.type=='CURVE':
            evaluated=obj.evaluated_get(depsgraph)
            data=evaluated.to_mesh()
        else:data=obj.data
        start=len(vertices)
        vertices.extend([obj.matrix_world@v.co for v in data.vertices])
        faces.extend([tuple(start+i for i in p.vertices) for p in data.polygons])
        if obj.type=='CURVE':evaluated.to_mesh_clear()
    data=bpy.data.meshes.new(name+' / web batch');data.from_pydata(vertices,[],faces);data.update()
    obj=bpy.data.objects.new(name+' / web batch',data)
    scene.collection.objects.link(obj)
    material=bpy.data.materials.new(name+' / web')
    material.use_nodes=True
    source=bpy.data.materials.get(name)
    bsdf=material.node_tree.nodes.get('Principled BSDF')
    if source and source.use_nodes:
        shader=source.node_tree.nodes.get('Principled BSDF')
        if shader:
            for key in ('Base Color','Roughness','Metallic'):
                bsdf.inputs[key].default_value=shader.inputs[key].default_value
    data.materials.append(material)
    # Decimate only complex geometry like dense distant house meshes. Keeps facade
    # silhouettes intact; surface brushwork comes from the shared generated atlas.
    if len(data.polygons)>14000:
        mod=obj.modifiers.new('Web geometry reduction','DECIMATE');mod.ratio=.55
    exports.append(obj)
for obj in scene.objects:obj.select_set(False)
for obj in exports:obj.select_set(True)
bpy.context.view_layer.objects.active=exports[0]
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/prototypes/harbor/assets/harbor-refined.glb'),
    export_format='GLB',use_selection=True,export_materials='EXPORT',export_cameras=False,
    export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
print('WEB_BATCHES',len(exports))
