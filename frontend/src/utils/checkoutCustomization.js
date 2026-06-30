export const generateId = () => Date.now() + Math.random();

export const parseJson = (val) => {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val || "[]"); } catch { return []; }
};

export const makeContent = (type) => ({
  _id: generateId(),
  type,
  bannerText: "",
  bannerTone: "info",
  benefits: [],
  buttonLabel: "",
  buttonUrl: "",
  headingText: "",
  headingLevel: "h2",
  imageUrl: "",
  imageAlt: "",
  spacerSize: "medium",
  textContent: "",
});

export const makeField = (type) => ({
  _id: generateId(),
  type,
  required: false,
  label: "",
  key: "",
  helpText: "",
  defaultChecked: false,
  choices: [],
  placeholder: "",
  dateType: "full",
  minAge: "",
  minAgeError: "You must be at least {age} to continue.",
  defaultDate: "",
});

export const parseDisplayConditions = (val) => {
  if (!val) return { combination: "all", conditions: [] };
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val) || { combination: "all", conditions: [] };
  } catch {
    return { combination: "all", conditions: [] };
  }
};

