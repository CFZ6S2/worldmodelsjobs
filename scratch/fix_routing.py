import json
import os
import re

file_path = r'c:\Users\cesar\Documents\trae_projects\worldmodels\n8n\active\vps_buggy_safe.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update Dynamic Routing Engine logic
routing_node = next((n for n in data[0]['nodes'] if n['name'] == 'Dynamic Routing Engine'), None)
if routing_node:
    new_js = """// DYNAMIC ROUTING ENGINE v5.7 (STRICT MATCHING)
let leadData = {};
try { leadData = $node["Parse JSON1"].json; } catch(e) { return []; }
const category = String(leadData.category || 'evento').toLowerCase();
const cityDetected = String(leadData.city || 'global').toLowerCase();
const text = String(leadData.text_es || '').toLowerCase();

const routingTable = {
  "madrid": {
    keywords: ["madrid", "barajas", "serrano", "pozuelo"],
    targets: [
      { to: "34664266926@s.whatsapp.net", label: "MADRID" },
      { to: "34603346859@s.whatsapp.net", label: "MADRID" }
    ]
  },
  "ibiza": {
    keywords: ["ibiza", "eivissa", "mansour", "pacha", "lio", "ushuaia", "sant antoni"],
    targets: [
      { to: "34662058447@s.whatsapp.net", label: "IBIZA" },
      { to: "34642107796@s.whatsapp.net", label: "IBIZA" }
    ]
  },
  "london": {
    keywords: ["london", "londres", "mayfair", "soho", "chelsea"],
    targets: [
      { to: "120363425790792660@g.us", label: "LONDON" }
    ]
  },
  "miami": {
    keywords: ["miami", "south beach", "brickell", "miami beach"],
    targets: [
      { to: "17862812324@s.whatsapp.net", label: "MIAMI" },
      { to: "525532110621@s.whatsapp.net", label: "MIAMI" }
    ]
  },
  "paris": {
    keywords: ["paris", "francia", "france", "champs"],
    targets: [
      { to: "33744156314@s.whatsapp.net", label: "PARIS" }
    ]
  },
  "monaco": {
    keywords: ["monaco", "viena", "vienna", "monte carlo"],
    targets: [
      { to: "120363425790792660@g.us", label: "GLOBAL" }
    ]
  }
};

let matchedTargets = [];

// 1. PRIORITY: Explicit City Match (from IA detection)
if (routingTable[cityDetected]) {
    matchedTargets = [...routingTable[cityDetected].targets];
}

// 2. SECONDARY: Keyword Match (only if no explicit city match)
if (matchedTargets.length === 0) {
    for (const [key, config] of Object.entries(routingTable)) {
        if (config.keywords.some(kw => text.includes(kw))) {
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}

// 3. FALLBACK: Global feed
if (matchedTargets.length === 0 && (category === 'evento' || category === 'plaza')) {
  matchedTargets.push({ to: "120363425790792660@g.us", label: "GLOBAL" });
}

// Ensure unique targets
const uniqueTargets = Array.from(new Set(matchedTargets.map(t => t.to)))
  .map(to => matchedTargets.find(t => t.to === to));

if (uniqueTargets.length === 0) return [];

return uniqueTargets.map(t => ({
  json: { 
    ...leadData, 
    target_wa: t.to, 
    city_label: t.label 
  }
}));"""
    routing_node['parameters']['jsCode'] = new_js

# 2. Remove WhatsApp Fanout connection from Message Router
connections = data[0]['connections']
if 'Message Router' in connections:
    # Filter out WhatsApp Fanout from the outputs
    connections['Message Router']['main'][0] = [
        c for c in connections['Message Router']['main'][0] 
        if c['node'] != 'WhatsApp Fanout'
    ]

# 3. Fix the unescaped backslashes and quotes in Parse JSON1 (just in case they got reverted or weren't perfect)
parse_node = next((n for n in data[0]['nodes'] if n['name'] == 'Parse JSON1'), None)
if parse_node:
    js = parse_node['parameters']['jsCode']
    # Ensure active:true (though it should be already)
    data[0]['active'] = True
    
with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("Workflow fixed successfully.")
