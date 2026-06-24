import json
import re

file_path = r"C:\Users\cesar\Downloads\WorldModels Enterprise Engine v5 (Fixed & Global).json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for node in data.get("nodes", []):
    if node.get("name") == "Message Router":
        js_code = node["parameters"]["jsCode"]
        # Replace the naive includes with regex test
        old_code = """const monacoKws = ["monaco", "cannes", "niza", "nice", "monte carlo", "côte d'azur"];
if (monacoKws.some(kw => cityRaw.includes(kw) || textRaw.includes(kw))) {"""
        new_code = """const monacoRegex = /\\b(monaco|cannes|niza|nice|monte carlo|côte d'azur)\\b/i;
if (monacoRegex.test(cityRaw) || monacoRegex.test(textRaw)) {"""
        node["parameters"]["jsCode"] = js_code.replace(old_code, new_code)
        
    if node.get("name") == "Dynamic Routing Engine":
        js_code = node["parameters"]["jsCode"]
        old_code = """for (const [key, config] of Object.entries(routingTable)) {
    if (config.keywords.some(kw => textNorm.includes(kw) || cityNorm.includes(kw))) {
         matchedTargets = [...matchedTargets, ...config.targets];
    }
}"""
        new_code = """for (const [key, config] of Object.entries(routingTable)) {
    // Usamos expresión regular con fronteras de palabra (\\b) para evitar coincidencias parciales
    const pattern = new RegExp(`\\\\b(${config.keywords.join('|')})\\\\b`, 'i');
    if (pattern.test(textNorm) || pattern.test(cityNorm)) {
         matchedTargets = [...matchedTargets, ...config.targets];
    }
}"""
        node["parameters"]["jsCode"] = js_code.replace(old_code, new_code)

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("JSON file patched for exact word matching.")
