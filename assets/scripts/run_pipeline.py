"""
ROAD TO PREDATOR LEAGUE (R2PL) - 3D ASSETS PIPELINE ORCHESTRATOR
Runs Blender headlessly to generate procedural GLB models for UniStops and Landmarks.

Usage:
  python assets/scripts/run_pipeline.py
"""

import subprocess
import os
import shutil
import sys

def main():
    print("=== ROAD TO PREDATOR LEAGUE: 3D PROCEDURAL ASSETS PIPELINE ===")
    
    # Locate Blender executable
    blender_bin = shutil.which("blender")
    if not blender_bin:
        # Check standard Windows paths
        candidate_paths = [
            r"C:\Program Files\Blender Foundation\Blender 4.3\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 4.1\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 4.0\blender.exe",
        ]
        for p in candidate_paths:
            if os.path.exists(p):
                blender_bin = p
                break

    if not blender_bin:
        print("[!] Blender executable not found in PATH or standard Program Files locations.")
        print("[!] Scripts can be manually run inside Blender via Scripting Workspace:")
        print("    - assets/scripts/generate_unistops.py")
        print("    - assets/scripts/generate_landmarks.py")
        return

    output_dir = os.path.abspath("client/public/assets/models")
    os.makedirs(output_dir, exist_ok=True)

    scripts = [
        "assets/scripts/generate_unistops.py",
        "assets/scripts/generate_landmarks.py"
    ]

    for script in scripts:
        script_path = os.path.abspath(script)
        cmd = [
            blender_bin,
            "--background",
            "--python", script_path,
            "--",
            "--output-dir", output_dir
        ]
        print(f"[*] Running: {' '.join(cmd)}")
        try:
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode == 0:
                print(f"[+] Successfully executed {script}")
            else:
                print(f"[-] Error executing {script}:\n{res.stderr}")
        except Exception as e:
            print(f"[-] Execution failed: {e}")

if __name__ == '__main__':
    main()
