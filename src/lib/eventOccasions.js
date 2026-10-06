export const OCCASIONS = {
  parties: { label: "Parties", subcategories: [{ value: "babies_baby_showers", label: "Babies & Baby Showers" }] },
  weddings: { label: "Weddings", subcategories: [{ value: "gifts", label: "Gifts" }] },
};

export const getOccasionLabel = (occasion, subcategory) => {
  const parent = OCCASIONS[occasion];
  const child = parent?.subcategories.find((item) => item.value === subcategory);
  return child ? `${parent.label} · ${child.label}` : parent?.label || "";
};