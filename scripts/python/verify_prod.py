
import requests
import json

url = "https://ssrworldmodelsjobs-bgr45y36sq-nw.a.run.app/api/leads"
payload = {
    "text_es": "NYC * Salida a las 11pm del Martes. Necesito a alguien disponible por $650 limpio por 1h de trabajo. El hotel esta pagado en Times Square. Contacto por MD.",
    "categoria": "CAT_PLAZAS"
}

print(f"Testing URL: {url}")
try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
