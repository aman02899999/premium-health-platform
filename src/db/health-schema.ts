/**
 * Health Data Platform — extended normalized schema
 * Preserves provenance for every record: source, source_id, source_url, license, retrieved_at, etc.
 * This file extends src/db/schema.ts without breaking existing tables
 */

import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, doublePrecision, index, uniqueIndex } from "drizzle-orm/pg-core";

// ============ DataSource & Provider Health ============

export const dataSources = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  provider: varchar("provider", { length: 120 }).notNull(),
  url: text("url"),
  license: varchar("license", { length: 255 }),
  attribution: text("attribution"),
  reliabilityLevel: varchar("reliability_level", { length: 40 }).default("medium"),
  updateFrequency: varchar("update_frequency", { length: 80 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const apiProviders = pgTable("api_providers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }),
  status: varchar("status", { length: 40 }).default("AVAILABLE"),
  enabled: boolean("enabled").default(true),
  baseUrl: text("base_url"),
  requiresKey: boolean("requires_key").default(false),
  lastCheck: timestamp("last_check"),
  lastSuccess: timestamp("last_success"),
  lastError: text("last_error"),
  responseTimeMs: integer("response_time_ms"),
  recordsImported: integer("records_imported").default(0),
  rateLimitRemaining: integer("rate_limit_remaining"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const apiRequestLogs = pgTable(
  "api_request_logs",
  {
    id: serial("id").primaryKey(),
    provider: varchar("provider", { length: 120 }).notNull(),
    endpoint: varchar("endpoint", { length: 500 }),
    query: text("query"),
    statusCode: integer("status_code"),
    responseTimeMs: integer("response_time_ms"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    providerIdx: index("api_request_logs_provider_idx").on(t.provider),
    createdAtIdx: index("api_request_logs_created_at_idx").on(t.createdAt),
  })
);

export const dataSyncJobs = pgTable("data_sync_jobs", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 120 }).notNull(),
  jobType: varchar("job_type", { length: 80 }).notNull(),
  status: varchar("status", { length: 40 }).default("pending"),
  progress: integer("progress").default(0),
  total: integer("total").default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  error: text("error"),
  logs: jsonb("logs"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ Food & Nutrition ============

export const foods = pgTable(
  "foods",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    brand: varchar("brand", { length: 255 }),
    barcode: varchar("barcode", { length: 50 }),
    category: varchar("category", { length: 120 }),
    servingSize: varchar("serving_size", { length: 120 }),
    image: text("image"),
    nutriScore: varchar("nutri_score", { length: 5 }),
    novaGroup: integer("nova_group"),
    // provenance
    source: varchar("source", { length: 120 }),
    sourceId: varchar("source_id", { length: 200 }),
    sourceUrl: text("source_url"),
    license: varchar("license", { length: 255 }),
    retrievedAt: timestamp("retrieved_at").defaultNow(),
    lastUpdated: timestamp("last_updated").defaultNow(),
    dataVersion: varchar("data_version", { length: 80 }),
    body: jsonb("body"),
  },
  (t) => ({
    barcodeIdx: uniqueIndex("foods_barcode_idx").on(t.barcode),
    nameIdx: index("foods_name_idx").on(t.name),
  })
);

export const foodNutrients = pgTable("food_nutrients", {
  id: serial("id").primaryKey(),
  foodId: integer("food_id").notNull(),
  calories: doublePrecision("calories"),
  protein: doublePrecision("protein"),
  carbs: doublePrecision("carbs"),
  fat: doublePrecision("fat"),
  fiber: doublePrecision("fiber"),
  sugar: doublePrecision("sugar"),
  sodium: doublePrecision("sodium"),
  saturatedFat: doublePrecision("saturated_fat"),
  per100g: boolean("per_100g").default(true),
});

export const foodIngredients = pgTable("food_ingredients", {
  id: serial("id").primaryKey(),
  foodId: integer("food_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  position: integer("position"),
});

export const foodAllergens = pgTable("food_allergens", {
  id: serial("id").primaryKey(),
  foodId: integer("food_id").notNull(),
  allergen: varchar("allergen", { length: 120 }).notNull(),
});

// ============ Fitness / Exercises ============

export const muscles = pgTable("muscles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  isFront: boolean("is_front"),
  image: text("image"),
  source: varchar("source", { length: 120 }),
  sourceId: varchar("source_id", { length: 120 }),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 120 }),
  sourceId: varchar("source_id", { length: 120 }),
});

export const exercises = pgTable(
  "exercises",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 120 }),
    difficulty: varchar("difficulty", { length: 40 }),
    images: jsonb("images"),
    source: varchar("source", { length: 120 }),
    sourceId: varchar("source_id", { length: 200 }),
    sourceUrl: text("source_url"),
    license: varchar("license", { length: 255 }),
    retrievedAt: timestamp("retrieved_at").defaultNow(),
    body: jsonb("body"),
  },
  (t) => ({
    nameIdx: index("exercises_name_idx").on(t.name),
  })
);

export const exerciseMuscles = pgTable("exercise_muscles", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").notNull(),
  muscleId: integer("muscle_id").notNull(),
  isSecondary: boolean("is_secondary").default(false),
});

export const exerciseEquipment = pgTable("exercise_equipment", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").notNull(),
  equipmentId: integer("equipment_id").notNull(),
});

export const workoutPlans = pgTable("workout_plans", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  difficulty: varchar("difficulty", { length: 40 }),
  daysPerWeek: integer("days_per_week"),
  source: varchar("source", { length: 120 }),
  body: jsonb("body"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  exerciseId: integer("exercise_id").notNull(),
  sets: integer("sets"),
  reps: varchar("reps", { length: 80 }),
  restSeconds: integer("rest_seconds"),
  position: integer("position"),
});

// ============ Diseases (extended) ============

export const diseaseAliases = pgTable("disease_aliases", {
  id: serial("id").primaryKey(),
  diseaseSlug: varchar("disease_slug", { length: 200 }).notNull(),
  alias: varchar("alias", { length: 255 }).notNull(),
  language: varchar("language", { length: 10 }).default("en"),
});

export const diseaseCodes = pgTable("disease_codes", {
  id: serial("id").primaryKey(),
  diseaseSlug: varchar("disease_slug", { length: 200 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  system: varchar("system", { length: 20 }).notNull(), // ICD-10, SNOMED
  display: varchar("display", { length: 255 }),
  definition: text("definition"),
  source: varchar("source", { length: 120 }),
  sourceUrl: text("source_url"),
});

// ============ Drugs (extended) ============

export const drugAliases = pgTable("drug_aliases", {
  id: serial("id").primaryKey(),
  drugSlug: varchar("drug_slug", { length: 200 }).notNull(),
  alias: varchar("alias", { length: 255 }).notNull(),
  type: varchar("type", { length: 40 }), // brand, generic, synonym
});

export const drugIngredients = pgTable("drug_ingredients", {
  id: serial("id").primaryKey(),
  drugSlug: varchar("drug_slug", { length: 200 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  strength: varchar("strength", { length: 120 }),
});

export const drugWarnings = pgTable("drug_warnings", {
  id: serial("id").primaryKey(),
  drugSlug: varchar("drug_slug", { length: 200 }).notNull(),
  warning: text("warning").notNull(),
  severity: varchar("severity", { length: 40 }),
  source: varchar("source", { length: 120 }),
});

export const drugContraindications = pgTable("drug_contraindications", {
  id: serial("id").primaryKey(),
  drugSlug: varchar("drug_slug", { length: 200 }).notNull(),
  contraindication: text("contraindication").notNull(),
  source: varchar("source", { length: 120 }),
});

export const drugAdverseReactions = pgTable("drug_adverse_reactions", {
  id: serial("id").primaryKey(),
  drugSlug: varchar("drug_slug", { length: 200 }).notNull(),
  reaction: text("reaction").notNull(),
  frequency: varchar("frequency", { length: 80 }),
  source: varchar("source", { length: 120 }),
});

export const drugDosages = pgTable("drug_dosages", {
  id: serial("id").primaryKey(),
  drugSlug: varchar("drug_slug", { length: 200 }).notNull(),
  dosage: text("dosage").notNull(),
  population: varchar("population", { length: 120 }),
  source: varchar("source", { length: 120 }),
});

export const drugInteractions = pgTable("drug_interactions", {
  id: serial("id").primaryKey(),
  drugSlug: varchar("drug_slug", { length: 200 }).notNull(),
  interactsWith: varchar("interacts_with", { length: 255 }).notNull(),
  description: text("description"),
  severity: varchar("severity", { length: 40 }),
  source: varchar("source", { length: 120 }),
});

// ============ Chemical Compounds ============

export const chemicalCompounds = pgTable("chemical_compounds", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  formula: varchar("formula", { length: 120 }),
  molecularWeight: doublePrecision("molecular_weight"),
  smiles: text("smiles"),
  iupacName: text("iupac_name"),
  cid: varchar("cid", { length: 50 }),
  source: varchar("source", { length: 120 }),
  sourceUrl: text("source_url"),
  retrievedAt: timestamp("retrieved_at").defaultNow(),
  body: jsonb("body"),
});

// ============ Medical Research ============

export const medicalArticles = pgTable(
  "medical_articles",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 300 }).notNull().unique(),
    pmid: varchar("pmid", { length: 20 }),
    title: text("title").notNull(),
    authors: jsonb("authors"),
    journal: varchar("journal", { length: 255 }),
    pubDate: varchar("pub_date", { length: 50 }),
    abstract: text("abstract"),
    url: text("url"),
    doi: varchar("doi", { length: 255 }),
    source: varchar("source", { length: 120 }),
    sourceUrl: text("source_url"),
    retrievedAt: timestamp("retrieved_at").defaultNow(),
    body: jsonb("body"),
  },
  (t) => ({
    pmidIdx: uniqueIndex("medical_articles_pmid_idx").on(t.pmid),
  })
);

export const clinicalTrials = pgTable(
  "clinical_trials",
  {
    id: serial("id").primaryKey(),
    nctId: varchar("nct_id", { length: 20 }).notNull().unique(),
    title: text("title").notNull(),
    status: varchar("status", { length: 80 }),
    phase: jsonb("phase"),
    conditions: jsonb("conditions"),
    locations: jsonb("locations"),
    url: text("url"),
    source: varchar("source", { length: 120 }),
    retrievedAt: timestamp("retrieved_at").defaultNow(),
    body: jsonb("body"),
  },
  (t) => ({
    nctIdIdx: uniqueIndex("clinical_trials_nct_id_idx").on(t.nctId),
  })
);

// ============ Ayurveda ============

export const ayurvedicHerbs = pgTable("ayurvedic_herbs", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  sanskritName: varchar("sanskrit_name", { length: 255 }),
  botanicalName: varchar("botanical_name", { length: 255 }),
  englishName: varchar("english_name", { length: 255 }),
  hindiName: varchar("hindi_name", { length: 255 }),
  plantParts: jsonb("plant_parts"),
  rasa: jsonb("rasa"),
  guna: jsonb("guna"),
  virya: varchar("virya", { length: 80 }),
  vipaka: varchar("vipaka", { length: 80 }),
  doshaKarma: jsonb("dosha_karma"),
  traditionalUses: jsonb("traditional_uses"),
  formulations: jsonb("formulations"),
  evidenceLevel: varchar("evidence_level", { length: 40 }).default("traditional"),
  source: varchar("source", { length: 120 }),
  sourceId: varchar("source_id", { length: 200 }),
  sourceUrl: text("source_url"),
  license: varchar("license", { length: 255 }),
  retrievedAt: timestamp("retrieved_at").defaultNow(),
  body: jsonb("body"),
});

export const ayurvedicSynonyms = pgTable("ayurvedic_synonyms", {
  id: serial("id").primaryKey(),
  herbSlug: varchar("herb_slug", { length: 200 }).notNull(),
  synonym: varchar("synonym", { length: 255 }).notNull(),
  language: varchar("language", { length: 20 }).default("sa"),
});

export const ayurvedicFormulations = pgTable("ayurvedic_formulations", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ingredients: jsonb("ingredients"),
  traditionalUse: text("traditional_use"),
  source: varchar("source", { length: 120 }),
  body: jsonb("body"),
});

// ============ Homeopathy ============

export const homeopathicRemedies = pgTable("homeopathic_remedies", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  commonNames: jsonb("common_names"),
  scientificName: varchar("scientific_name", { length: 255 }),
  materiaMedicaRef: varchar("materia_medica_ref", { length: 255 }),
  traditionalIndications: jsonb("traditional_indications"),
  potencyInfo: text("potency_info"),
  source: varchar("source", { length: 120 }),
  sourceId: varchar("source_id", { length: 200 }),
  license: varchar("license", { length: 255 }),
  retrievedAt: timestamp("retrieved_at").defaultNow(),
  body: jsonb("body"),
});

// ============ Indian Medicines ============

export const indianMedicines = pgTable("indian_medicines", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  genericComposition: text("generic_composition"),
  dosageForm: varchar("dosage_form", { length: 120 }),
  manufacturer: varchar("manufacturer", { length: 255 }),
  pharmacologicalInfo: text("pharmacological_info"),
  source: varchar("source", { length: 120 }),
  sourceId: varchar("source_id", { length: 200 }),
  sourceUrl: text("source_url"),
  license: varchar("license", { length: 255 }),
  retrievedAt: timestamp("retrieved_at").defaultNow(),
  body: jsonb("body"),
});

// ============ User Health (for future) ============

export const userHealthProfiles = pgTable("user_health_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  age: integer("age"),
  gender: varchar("gender", { length: 20 }),
  heightCm: doublePrecision("height_cm"),
  weightKg: doublePrecision("weight_kg"),
  bmi: doublePrecision("bmi"),
  goals: jsonb("goals"),
  conditions: jsonb("conditions"),
  allergies: jsonb("allergies"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userMeasurements = pgTable("user_measurements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 80 }).notNull(), // weight, bp, glucose, etc
  value: doublePrecision("value").notNull(),
  unit: varchar("unit", { length: 40 }),
  measuredAt: timestamp("measured_at").defaultNow(),
  source: varchar("source", { length: 120 }),
  notes: text("notes"),
});

export const userWorkoutLogs = pgTable("user_workout_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  workoutId: integer("workout_id"),
  exerciseId: integer("exercise_id"),
  durationMinutes: integer("duration_minutes"),
  caloriesBurned: integer("calories_burned"),
  performedAt: timestamp("performed_at").defaultNow(),
  body: jsonb("body"),
});

export const userNutritionLogs = pgTable("user_nutrition_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  foodId: integer("food_id"),
  quantity: doublePrecision("quantity"),
  unit: varchar("unit", { length: 40 }),
  calories: doublePrecision("calories"),
  protein: doublePrecision("protein"),
  carbs: doublePrecision("carbs"),
  fat: doublePrecision("fat"),
  loggedAt: timestamp("logged_at").defaultNow(),
  body: jsonb("body"),
});
