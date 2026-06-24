const input = {
  texto_limpio: "Busco chica en monaco hoy pago alto. @testuser9"
};
const lowerRaw = (input.texto_limpio).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

let parsed = { category: "trash" }; // simulate AI returning trash

const finalData = {
  category: (parsed.category || "trash").toLowerCase(),
  trash: true
};

const highValueKeywords = ["mansour", "ibiza", "lio", "pacha", "monaco", "viena", "dubai", "manila"];

console.log("lowerRaw includes monaco?", lowerRaw.includes("monaco"));
console.log("some keyword matches?", highValueKeywords.some(kw => lowerRaw.includes(kw)));

if (highValueKeywords.some(kw => lowerRaw.includes(kw))) {
  finalData.trash = false;
  if (finalData.category === 'trash') finalData.category = "evento";
}

console.log("FINAL DATA CATEGORY:", finalData.category);
