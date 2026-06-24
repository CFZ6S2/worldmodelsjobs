import subprocess
import json

dre_code = """
const leadData = $json;

function normalize(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const category = String(leadData.category || 'evento').toLowerCase().trim();
const cityDetected = normalize(String(leadData.city || 'global').toLowerCase().trim());
const text = normalize(String(leadData.texto_limpio || leadData.text_es || leadData.original_text || leadData.text_en || leadData.text_pt || leadData.text || '').toLowerCase());

const routingTable = {
  "russia_turkey": {
    keywords: ["rusia", "russia", "\\\\bru\\\\b", "россия", "moscu", "moscow", "москва", "san petersburgo", "saint petersburg", "st petersburg", "санкт-петербург", "питер", "kazan", "казань", "sochi", "сочи", "vladivostok", "владивосток", "novosibirsk", "новосибирск", "ekaterimburgo", "yekaterinburg", "екатеринбург", "baku", "баку", "tiflis", "tbilisi", "тбилиси", "kiev", "kyiv", "киев", "київ", "киів", "turquia", "turkey", "türkiye", "турция", "estambul", "istanbul", "стамбул", "ankara", "анкара", "antalya", "анталья", "анталия", "izmir", "esmirna", "измир", "bodrum", "бодрум", "bursa", "бурса", "capadocia", "cappadocia", "каппадокия"],
    targets: [
      { to: "37257825047@s.whatsapp.net", label: "RUSSIA_TURKEY" }
    ]
  },
  "madrid": {
    keywords: ["madrid", "barajas", "serrano", "pozuelo"],
    targets: [
      { to: "353830078788@s.whatsapp.net", label: "MADRID", categoryFilter: "evento" },
      { to: "5511993351980@s.whatsapp.net", label: "MADRID (PT)", categoryFilter: "evento" }
    ]
  },
  "monaco": {
    keywords: ["monaco", "monte carlo", "cannes", "\\\\bniza\\\\b", "cote d'azur"],
    targets: [
      { to: "33672474796@s.whatsapp.net", label: "COSTA AZUL" }
    ]
  },
  "ibiza": {
    keywords: ["ibiza", "eivissa"],
    targets: [
      { to: "34601169815@s.whatsapp.net", label: "IBIZA" },
      { to: "34670652138@s.whatsapp.net", label: "IBIZA", categoryFilter: "evento, habitacion" }
    ]
  },
  "marbella": {
    keywords: ["marbella", "puerto banus", "costa del sol", "malaga", "málaga", "estepona"],
    targets: [
      { to: "34670652138@s.whatsapp.net", label: "MARBELLA", categoryFilter: "evento, habitacion" }
    ]
  },
  "suiza": {
    keywords: ["suiza", "switzerland", "zurich", "ginebra", "basilea", "berna", "lausana", "lugano", "lucerna", "schweiz", "suisse", "svizzera", "zurigo"],
    targets: [
      { to: "573183836809@s.whatsapp.net", label: "SUIZA" }
    ]
  },
  "amsterdam": {
    keywords: ["amsterdam", "holanda", "paises bajos", "netherlands", "nederland", "rotterdam", "la haya", "schiphol", "utrecht"],
    targets: [
      { to: "584162013551@s.whatsapp.net", label: "AMSTERDAM" }
    ]
  },
  "london": {
    keywords: ["london", "londres", "mayfair", "soho", "chelsea", "\\\\buk\\\\b", "england", "inglaterra"],
    targets: [
      { to: "447438757923@s.whatsapp.net", label: "LONDON" }
    ]
  }
};

let matchedTargets = [];

if (routingTable[cityDetected]) {
    matchedTargets = [...routingTable[cityDetected].targets];
} else {
    for (const [key, config] of Object.entries(routingTable)) {
        if (cityDetected.includes(key) || config.keywords.some(kw => cityDetected.includes(kw))) {
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}

if (matchedTargets.length === 0) {
    for (const [key, config] of Object.entries(routingTable)) {
        if (config.keywords.some(kw => {
            if (kw.includes('\\\\b')) return new RegExp(kw, 'i').test(text);
            return text.includes(kw);
        })) {
             matchedTargets = [...matchedTargets, ...config.targets];
        }
    }
}

matchedTargets = matchedTargets.filter(t => !t.categoryFilter || category.includes(t.categoryFilter) || t.categoryFilter.includes(category));

const uniqueTargets = Array.from(new Set(matchedTargets.map(t => t.to)))
  .map(to => matchedTargets.find(t => t.to === to));

return uniqueTargets.map(t => {
    const result = { ...leadData };
    result.target_wa = t.to;
    result.city_label = t.label;
    return { json: result };
});
"""

def patch_workflow():
    try:
        subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/wf_dre.json"], check=True)
        subprocess.run(["docker", "cp", "n8n:/tmp/wf_dre.json", "/tmp/wf_dre.json"], check=True)
    except Exception as e:
        print(f"Error exporting workflow: {e}")
        return

    with open('/tmp/wf_dre.json', 'r') as f:
        wf = json.load(f)

    if isinstance(wf, list):
        wf = wf[0]

    patched = False
    for n in wf.get('nodes', []):
        if n['name'] == 'Dynamic Routing Engine':
            n['parameters']['jsCode'] = dre_code
            patched = True

    if patched:
        with open('/tmp/wf_dre_out.json', 'w') as f:
            json.dump(wf, f)
            
        try:
            subprocess.run(["docker", "cp", "/tmp/wf_dre_out.json", "n8n:/tmp/wf_dre_out.json"], check=True)
            subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_dre_out.json"], check=True)
            print("Successfully updated the DRE node.")
        except Exception as e:
            print(f"Error importing workflow: {e}")

if __name__ == '__main__':
    patch_workflow()
