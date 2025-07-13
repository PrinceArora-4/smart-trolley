import yaml
import json
import re

input_file = r"yolo\data.yaml"       
output_file = r"backend\products.json"

# === LOAD CLASS NAMES FROM data.yaml ===
with open(input_file, "r") as f:
    data = yaml.safe_load(f)
    class_names = data["names"]

# === HELPER: Normalize and Extract Details ===
product_dict = {}

for entry in class_names:
    # Remove "front/back/side" suffix
    clean_name = re.sub(r"_(front|back|side)$", "", entry)

    # Extract parts
    parts = clean_name.split("_")
    try:
        weight = next(p for p in parts if "g" in p.lower())  # e.g. 150g
        price_str = next(p for p in parts if "rs" in p.lower())  # e.g. 110rs
        price = int(re.sub("[^0-9]", "", price_str))  # Extract number from 110rs

        # Find name (everything before weight)
        weight_index = parts.index(weight)
        name_parts = parts[:weight_index]
        product_name = " ".join(name_parts)

        # Avoid duplicates
        if clean_name not in product_dict:
            product_dict[clean_name] = {
                "name": product_name,
                "price": price,
                "description": f"{product_name} - {weight} pack"
            }

    except Exception as e:
        print(f"❌ Skipped Invalid Class: {entry} | Error: {e}")

# === FORMAT FOR FLASK USAGE ===
final_json = {}
for k, v in product_dict.items():
    final_json[v["name"].lower()] = {
        "price": v["price"],
        "description": v["description"]
    }

# === WRITE TO FILE ===
with open(output_file, "w") as f:
    json.dump(final_json, f, indent=4)

print(f"✅ products.json Generated With {len(final_json)} Products.")
