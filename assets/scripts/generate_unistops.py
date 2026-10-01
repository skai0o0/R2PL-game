"""
ROAD TO PREDATOR LEAGUE (R2PL) - PROCEDURAL 3D ASSETS PIPELINE
Script: generate_unistops.py
Role: Generates high-tech procedural 3D GLB models for UniStop supply stations:
  1. UniStop - Aspire (Cyan energy kiosk)
  2. UniStop - Nitro (Aggressive red/crimson aerodynamic hub)
  3. UniStop - Predator (Signature stealth obelisk with floating energy core)

Usage:
  blender --background --python assets/scripts/generate_unistops.py -- --output-dir client/public/assets/models
"""

import os
import sys
import math

try:
    import bpy
    import bmesh
except ImportError:
    print("Warning: Running outside of Blender environment. This script requires Blender bpy module.")
    bpy = None

def clean_scene():
    if not bpy:
        return
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for collection in bpy.data.collections:
        bpy.data.collections.remove(collection)

def create_cyber_material(name, base_color=(0.04, 0.05, 0.07, 1.0), roughness=0.25, metallic=0.9, emission_color=(0.0, 1.0, 0.91, 1.0), emission_strength=5.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()

    node_principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_principled.location = (0, 0)
    node_principled.inputs['Base Color'].default_value = base_color
    node_principled.inputs['Roughness'].default_value = roughness
    node_principled.inputs['Metallic'].default_value = metallic

    if emission_strength > 0:
        node_principled.inputs['Emission Color'].default_value = emission_color
        node_principled.inputs['Emission Strength'].default_value = emission_strength

    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    node_output.location = (300, 0)
    mat.node_tree.links.new(node_principled.outputs['BSDF'], node_output.inputs['Surface'])
    return mat

def build_unistop_aspire(mat_black, mat_cyan):
    """
    UniStop - Aspire: Sleek angled charging kiosk with solar/cyan visor
    """
    # 1. Base pedestal
    bpy.ops.mesh.primitive_cube_add(size=2.0, location=(0, 0, 0.15))
    base = bpy.context.active_object
    base.name = "Aspire_Base"
    base.scale = (1.2, 1.2, 0.15)
    base.data.materials.append(mat_black)

    # 2. Main Kiosk Tower
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.6))
    tower = bpy.context.active_object
    tower.name = "Aspire_Tower"
    tower.scale = (0.6, 0.4, 2.8)
    tower.data.materials.append(mat_black)

    # 3. Holographic Visor Screen (Cyan Glow)
    bpy.ops.mesh.primitive_plane_add(size=0.7, location=(0, 0.22, 2.2))
    screen = bpy.context.active_object
    screen.name = "Aspire_Screen"
    screen.rotation_euler = (math.radians(75), 0, 0)
    screen.scale = (1.0, 1.4, 1.0)
    screen.data.materials.append(mat_cyan)

    # 4. Energy Pylon Ring
    bpy.ops.mesh.primitive_torus_add(major_radius=0.7, minor_radius=0.04, location=(0, 0, 3.1))
    ring = bpy.context.active_object
    ring.name = "Aspire_Halo"
    ring.data.materials.append(mat_cyan)

def build_unistop_nitro(mat_black, mat_red):
    """
    UniStop - Nitro: Aggressive aerodynamic twin-exhaust hub
    """
    # Base
    bpy.ops.mesh.primitive_cylinder_add(radius=1.5, depth=0.3, vertices=8, location=(0, 0, 0.15))
    base = bpy.context.active_object
    base.name = "Nitro_Base"
    base.data.materials.append(mat_black)

    # Twin angled thruster pylons
    for side in (-0.6, 0.6):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side, 0, 1.8))
        wing = bpy.context.active_object
        wing.name = f"Nitro_Wing_{side}"
        wing.scale = (0.35, 0.8, 3.0)
        wing.rotation_euler = (0, math.radians(side * 10), 0)
        wing.data.materials.append(mat_black)

        # Red turbine exhausts
        bpy.ops.mesh.primitive_cylinder_add(radius=0.25, depth=0.2, location=(side, 0, 3.4))
        nozzle = bpy.context.active_object
        nozzle.name = f"Nitro_Nozzle_{side}"
        nozzle.data.materials.append(mat_red)

def build_unistop_predator(mat_black, mat_cyan, mat_gold):
    """
    UniStop - Predator: Stealth triangular obelisk with levitating core
    """
    # 3-sided Triangular base platform
    bpy.ops.mesh.primitive_cylinder_add(radius=2.0, depth=0.4, vertices=3, location=(0, 0, 0.2))
    base = bpy.context.active_object
    base.name = "Predator_Base"
    base.data.materials.append(mat_black)

    # 3 Corner obelisks
    for i in range(3):
        angle = i * (2 * math.pi / 3)
        ox = math.cos(angle) * 1.3
        oy = math.sin(angle) * 1.3

        bpy.ops.mesh.primitive_cone_add(radius1=0.4, radius2=0.1, depth=3.8, vertices=4, location=(ox, oy, 2.0))
        obelisk = bpy.context.active_object
        obelisk.name = f"Predator_Pillar_{i}"
        obelisk.rotation_euler = (0, 0, angle)
        obelisk.data.materials.append(mat_black)

    # Central Levitating Hologram Core (Floating Diamond)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.5, depth=1.2, vertices=4, location=(0, 0, 2.2))
    core = bpy.context.active_object
    core.name = "Predator_Core"
    core.rotation_euler = (math.radians(45), math.radians(45), 0)
    core.data.materials.append(mat_cyan)

    # Crown ring
    bpy.ops.mesh.primitive_torus_add(major_radius=1.2, minor_radius=0.06, location=(0, 0, 4.0))
    crown = bpy.context.active_object
    crown.name = "Predator_Crown"
    crown.data.materials.append(mat_gold)

def export_all_models(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    if not bpy:
        print("Skipping export: Blender bpy not available.")
        return

    # Materials
    mat_black = create_cyber_material("MatteBlackAlloy", base_color=(0.04, 0.05, 0.07, 1.0), roughness=0.3, metallic=0.9, emission_strength=0)
    mat_cyan = create_cyber_material("PredatorCyanGlow", base_color=(0.0, 1.0, 0.91, 1.0), emission_color=(0.0, 1.0, 0.91, 1.0), emission_strength=8.0)
    mat_red = create_cyber_material("NitroRedGlow", base_color=(1.0, 0.16, 0.33, 1.0), emission_color=(1.0, 0.16, 0.33, 1.0), emission_strength=8.0)
    mat_gold = create_cyber_material("GoldTrim", base_color=(1.0, 0.72, 0.0, 1.0), emission_color=(1.0, 0.72, 0.0, 1.0), emission_strength=4.0)

    # Model 1: Aspire
    clean_scene()
    build_unistop_aspire(mat_black, mat_cyan)
    path_aspire = os.path.join(output_dir, "unistop_aspire.glb")
    bpy.ops.export_scene.gltf(filepath=path_aspire, export_format='GLB')
    print(f"Exported: {path_aspire}")

    # Model 2: Nitro
    clean_scene()
    build_unistop_nitro(mat_black, mat_red)
    path_nitro = os.path.join(output_dir, "unistop_nitro.glb")
    bpy.ops.export_scene.gltf(filepath=path_nitro, export_format='GLB')
    print(f"Exported: {path_nitro}")

    # Model 3: Predator
    clean_scene()
    build_unistop_predator(mat_black, mat_cyan, mat_gold)
    path_predator = os.path.join(output_dir, "unistop_predator.glb")
    bpy.ops.export_scene.gltf(filepath=path_predator, export_format='GLB')
    print(f"Exported: {path_predator}")

if __name__ == '__main__':
    out_dir = "client/public/assets/models"
    for i, arg in enumerate(sys.argv):
        if arg == '--output-dir' and i + 1 < len(sys.argv):
            out_dir = sys.argv[i + 1]
    export_all_models(out_dir)
