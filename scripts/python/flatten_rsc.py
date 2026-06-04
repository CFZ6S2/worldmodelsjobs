import os
import shutil

def flatten_rsc():
    out_dir = r"c:\Users\cesar\Documents\trae_projects\worldmodels\web\out"
    if not os.path.exists(out_dir):
        print(f"Error: {out_dir} does not exist.")
        return

    print(f"[*] Scanning {out_dir} for RSC files to flatten...")
    count = 0
    for root, dirs, files in os.walk(out_dir):
        for d in dirs:
            if d == "__next.$d$locale":
                locale_dir = os.path.join(root, d)
                # Find all files inside this directory recursively
                for r_sub, _, f_subs in os.walk(locale_dir):
                    for f in f_subs:
                        src_file = os.path.join(r_sub, f)
                        # Get path relative to the __next.$d$locale directory
                        rel_path = os.path.relpath(src_file, locale_dir)
                        # Replace directory separators with dots to flatten the name
                        flat_name = rel_path.replace(os.sep, ".")
                        dest_filename = f"__next.$d$locale.{flat_name}"
                        dest_file = os.path.join(root, dest_filename)
                        
                        print(f"Copying: {rel_path} -> {dest_filename}")
                        shutil.copy2(src_file, dest_file)
                        count += 1
                        
    print(f"[SUCCESS] Flattened {count} RSC payload files.")

if __name__ == "__main__":
    flatten_rsc()
