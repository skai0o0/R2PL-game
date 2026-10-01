"""
ROAD TO PREDATOR LEAGUE (R2PL) - PROCEDURAL 3D ASSETS PIPELINE
Script: generate_landmarks.py
Role: Generates high-tech Cyberpunk 3D GLB models for the 10 National Landmarks & Scenic Spots:
  1. Đỉnh Fansipan (Chóp inox nóc nhà Đông Dương, bệ đá bậc thang High-tech)
  2. Vịnh Hạ Long (Hòn Trống Mái cách điệu hợp kim đen nhám, đài laser)
  3. Núi Ngũ Hành Sơn (5 ngọn núi ngũ hành lồng ghép tinh thể pha lê)
  4. Động Phong Nha (Vòm hang thạch nhũ kết hợp LED viền thám hiểm)
  5. Núi Bà Đen (Đỉnh núi vươn mây với đài tiếp sóng năng lượng)
  6. Hoàng thành Thăng Long (Đoan Môn cổ kính kết hợp khung viền laser viễn tưởng)
  7. Cảng Hải Phòng (Cần cẩu giàn công nghệ và ngọn hải đăng quét sóng)
  8. Kinh Thành Huế (Cột cờ Phu Văn Lâu / Ngọ Môn phong cách Cyberpunk)
  9. Toà nhà Bitexco (Tòa tháp búp sen biểu tượng với sân đỗ trực thăng phát sáng)
  10. Chợ nổi Cái Răng (Bến thuyền sông nước Tây Nam Bộ phong cách Cyberpunk)

Usage:
  blender --background --python assets/scripts/generate_landmarks.py -- --output-dir client/public/assets/models
"""

import os
import sys
import math

try:
    import bpy
except ImportError:
    print("Warning: Running outside Blender environment. bpy not available.")
    bpy = None

def clean_scene():
    if not bpy:
        return
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for col in bpy.data.collections:
        bpy.data.collections.remove(col)

def create_mat(name, color=(0.1, 0.1, 0.1, 1.0), roughness=0.3, metallic=0.8, emissive=None, emissive_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()

    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic

    if emissive:
        bsdf.inputs['Emission Color'].default_value = emissive
        bsdf.inputs['Emission Strength'].default_value = emissive_strength

    out = nodes.new(type='ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat

def build_fansipan(mat_black, mat_inox, mat_cyan):
    # 3-tier high tech stone terrace
    for i in range(3):
        bpy.ops.mesh.primitive_cylinder_add(radius=3.0 - i * 0.7, depth=0.4, vertices=6, location=(0, 0, i * 0.4))
        b = bpy.context.active_object
        b.data.materials.append(mat_black)

    # Stainless steel apex pyramid
    bpy.ops.mesh.primitive_cone_add(radius1=1.0, radius2=0.0, depth=2.4, vertices=3, location=(0, 0, 2.2))
    apex = bpy.context.active_object
    apex.data.materials.append(mat_inox)

    # Laser beacon atop apex
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=4.0, location=(0, 0, 5.0))
    beam = bpy.context.active_object
    beam.data.materials.append(mat_cyan)

def build_bitexco(mat_glass, mat_cyan, mat_alloy):
    # Curved aerodynamic lotus tower body
    bpy.ops.mesh.primitive_cylinder_add(radius=1.2, depth=8.0, vertices=16, location=(0, 0, 4.0))
    tower = bpy.context.active_object
    tower.scale = (0.9, 1.4, 1.0)
    tower.data.materials.append(mat_glass)

    # Helipad cantilever disk (Sân đỗ trực thăng chìa ra)
    bpy.ops.mesh.primitive_cylinder_add(radius=1.1, depth=0.15, vertices=24, location=(0, 1.4, 5.8))
    pad = bpy.context.active_object
    pad.data.materials.append(mat_alloy)

    # Helipad glowing cyan ring
    bpy.ops.mesh.primitive_torus_add(major_radius=0.9, minor_radius=0.05, location=(0, 1.4, 5.9))
    ring = bpy.context.active_object
    ring.data.materials.append(mat_cyan)

    # Crown spire
    bpy.ops.mesh.primitive_cone_add(radius1=0.6, radius2=0.0, depth=2.0, vertices=12, location=(0, 0, 8.8))
    spire = bpy.context.active_object
    spire.data.materials.append(mat_cyan)

def build_halong(mat_rock, mat_cyan, mat_water):
    # Holographic water disk base
    bpy.ops.mesh.primitive_cylinder_add(radius=3.5, depth=0.1, vertices=32, location=(0, 0, 0.05))
    water = bpy.context.active_object
    water.data.materials.append(mat_water)

    # Twin stylized islets (Hòn Trống & Hòn Mái)
    bpy.ops.mesh.primitive_cone_add(radius1=1.2, radius2=0.4, depth=3.2, vertices=5, location=(-1.0, 0, 1.6))
    islet1 = bpy.context.active_object
    islet1.rotation_euler = (math.radians(8), 0, math.radians(20))
    islet1.data.materials.append(mat_rock)

    bpy.ops.mesh.primitive_cone_add(radius1=0.9, radius2=0.3, depth=2.8, vertices=5, location=(1.0, 0.2, 1.4))
    islet2 = bpy.context.active_object
    islet2.rotation_euler = (-math.radians(6), 0, -math.radians(15))
    islet2.data.materials.append(mat_rock)

    # Laser link between islets
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=2.0, location=(0, 0.1, 2.0))
    laser = bpy.context.active_object
    laser.rotation_euler = (0, math.radians(90), 0)
    laser.data.materials.append(mat_cyan)

def build_hue(mat_gold, mat_red, mat_alloy):
    # Phu Van Lau / Ngo Mon Citadel Bastion
    bpy.ops.mesh.primitive_cube_add(size=3.0, location=(0, 0, 0.6))
    base = bpy.context.active_object
    base.scale = (1.5, 0.8, 0.4)
    base.data.materials.append(mat_alloy)

    # 3 Arched Portals
    for dx in (-1.2, 0, 1.2):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=0.9, vertices=12, location=(dx, 0, 0.4))
        arch = bpy.context.active_object
        arch.rotation_euler = (math.radians(90), 0, 0)
        arch.data.materials.append(mat_red)

    # Imperial Pavilion 2nd Tier
    bpy.ops.mesh.primitive_cube_add(size=2.0, location=(0, 0, 1.8))
    pavilion = bpy.context.active_object
    pavilion.scale = (1.2, 0.6, 0.5)
    pavilion.data.materials.append(mat_gold)

    # Cyber Flagmast
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=3.5, location=(0, 0, 3.8))
    mast = bpy.context.active_object
    mast.data.materials.append(mat_gold)

def export_all_landmarks(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    if not bpy:
        print("Blender bpy not found. Skipping procedural 3D model generation.")
        return

    mat_black = create_mat("BlackAlloy", color=(0.05, 0.05, 0.08, 1.0))
    mat_inox = create_mat("InoxFansipan", color=(0.9, 0.9, 0.95, 1.0), roughness=0.1, metallic=1.0)
    mat_cyan = create_mat("PredatorCyan", color=(0.0, 1.0, 0.91, 1.0), emissive=(0.0, 1.0, 0.91, 1.0), emissive_strength=10.0)
    mat_glass = create_mat("CyberGlass", color=(0.05, 0.2, 0.35, 0.7), roughness=0.1, metallic=0.2)
    mat_water = create_mat("HoloWater", color=(0.0, 0.5, 0.8, 0.8), emissive=(0.0, 0.5, 0.8, 1.0), emissive_strength=3.0)
    mat_gold = create_mat("ImperialGold", color=(1.0, 0.75, 0.1, 1.0), emissive=(1.0, 0.75, 0.1, 1.0), emissive_strength=4.0)
    mat_red = create_mat("LaserRed", color=(1.0, 0.1, 0.2, 1.0), emissive=(1.0, 0.1, 0.2, 1.0), emissive_strength=6.0)

    # 1. Fansipan
    clean_scene()
    build_fansipan(mat_black, mat_inox, mat_cyan)
    bpy.ops.export_scene.gltf(filepath=os.path.join(output_dir, "scenic_fansipan.glb"), export_format='GLB')

    # 2. Bitexco
    clean_scene()
    build_bitexco(mat_glass, mat_cyan, mat_black)
    bpy.ops.export_scene.gltf(filepath=os.path.join(output_dir, "landmark_bitexco.glb"), export_format='GLB')

    # 3. Ha Long
    clean_scene()
    build_halong(mat_black, mat_cyan, mat_water)
    bpy.ops.export_scene.gltf(filepath=os.path.join(output_dir, "scenic_halong.glb"), export_format='GLB')

    # 4. Hue Citadel
    clean_scene()
    build_hue(mat_gold, mat_red, mat_black)
    bpy.ops.export_scene.gltf(filepath=os.path.join(output_dir, "landmark_hue.glb"), export_format='GLB')

    print(f"Exported landmark GLBs to: {output_dir}")

if __name__ == '__main__':
    out_dir = "client/public/assets/models"
    for i, arg in enumerate(sys.argv):
        if arg == '--output-dir' and i + 1 < len(sys.argv):
            out_dir = sys.argv[i + 1]
    export_all_landmarks(out_dir)
