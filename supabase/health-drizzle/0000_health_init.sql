-- Premium Health Platform tables, isolated in their own schema.
CREATE SCHEMA IF NOT EXISTS "health";
--> statement-breakpoint
CREATE TABLE "health"."ads" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot" varchar(80) NOT NULL,
	"label" varchar(255),
	"enabled" boolean DEFAULT true,
	"code" text
);
--> statement-breakpoint
CREATE TABLE "health"."affiliate_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer,
	"url" text NOT NULL,
	"merchant" varchar(255),
	"clicks" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(300) NOT NULL,
	"subtitle" text,
	"category" varchar(120),
	"body" jsonb,
	"status" varchar(40) DEFAULT 'published',
	"featured" boolean DEFAULT false,
	"author_id" integer,
	"reviewer_id" integer,
	"published_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."authors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"qualification" varchar(255),
	"bio" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(80) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."diet_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" jsonb,
	"status" varchar(40) DEFAULT 'published',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "diet_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."diseases" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"hindi_name" varchar(255),
	"short" text,
	"system" varchar(120),
	"category" varchar(120),
	"body" jsonb,
	"status" varchar(40) DEFAULT 'published',
	"seo_title" varchar(255),
	"seo_description" text,
	"author_id" integer,
	"reviewer_id" integer,
	"published_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "diseases_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(60) NOT NULL,
	"entity_slug" varchar(200) NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health"."herbs" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"botanical_name" varchar(255),
	"short" text,
	"body" jsonb,
	"status" varchar(40) DEFAULT 'published',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "herbs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."lab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"short" text,
	"body" jsonb,
	"status" varchar(40) DEFAULT 'published',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "lab_tests_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."medical_reviewers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"qualification" varchar(255),
	"specialty" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."medicines" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"generic_name" varchar(255) NOT NULL,
	"drug_class" varchar(255),
	"short" text,
	"body" jsonb,
	"status" varchar(40) DEFAULT 'published',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "medicines_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."news_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(220) NOT NULL,
	"title" varchar(320) NOT NULL,
	"summary" text,
	"category" varchar(80) NOT NULL,
	"kind" varchar(40) DEFAULT 'briefing',
	"body" jsonb,
	"source_name" varchar(255),
	"source_url" text,
	"status" varchar(40) DEFAULT 'draft',
	"author" varchar(255),
	"reviewer" varchar(255),
	"published_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "news_items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"consent" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "health"."nutrition_foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(120),
	"short" text,
	"body" jsonb,
	"status" varchar(40) DEFAULT 'published',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "nutrition_foods_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" varchar(500) NOT NULL,
	"views" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(120),
	"short" text,
	"body" jsonb,
	"affiliate_url" text,
	"merchant" varchar(255),
	"status" varchar(40) DEFAULT 'published',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"body" jsonb,
	"status" varchar(40) DEFAULT 'published',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "recipes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."references_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(60) NOT NULL,
	"entity_slug" varchar(200) NOT NULL,
	"title" text NOT NULL,
	"source" varchar(255),
	"year" varchar(10),
	"url" text
);
--> statement-breakpoint
CREATE TABLE "health"."symptoms" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"short" text,
	"body" jsonb,
	"status" varchar(40) DEFAULT 'published',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "symptoms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" varchar(160) NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"role" varchar(50) DEFAULT 'reader',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "health"."api_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"display_name" varchar(255),
	"status" varchar(40) DEFAULT 'AVAILABLE',
	"enabled" boolean DEFAULT true,
	"base_url" text,
	"requires_key" boolean DEFAULT false,
	"last_check" timestamp,
	"last_success" timestamp,
	"last_error" text,
	"response_time_ms" integer,
	"records_imported" integer DEFAULT 0,
	"rate_limit_remaining" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "api_providers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "health"."api_request_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(120) NOT NULL,
	"endpoint" varchar(500),
	"query" text,
	"status_code" integer,
	"response_time_ms" integer,
	"error" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."ayurvedic_formulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"ingredients" jsonb,
	"traditional_use" text,
	"source" varchar(120),
	"body" jsonb,
	CONSTRAINT "ayurvedic_formulations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."ayurvedic_herbs" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"sanskrit_name" varchar(255),
	"botanical_name" varchar(255),
	"english_name" varchar(255),
	"hindi_name" varchar(255),
	"plant_parts" jsonb,
	"rasa" jsonb,
	"guna" jsonb,
	"virya" varchar(80),
	"vipaka" varchar(80),
	"dosha_karma" jsonb,
	"traditional_uses" jsonb,
	"formulations" jsonb,
	"evidence_level" varchar(40) DEFAULT 'traditional',
	"source" varchar(120),
	"source_id" varchar(200),
	"source_url" text,
	"license" varchar(255),
	"retrieved_at" timestamp DEFAULT now(),
	"body" jsonb,
	CONSTRAINT "ayurvedic_herbs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."ayurvedic_synonyms" (
	"id" serial PRIMARY KEY NOT NULL,
	"herb_slug" varchar(200) NOT NULL,
	"synonym" varchar(255) NOT NULL,
	"language" varchar(20) DEFAULT 'sa'
);
--> statement-breakpoint
CREATE TABLE "health"."chemical_compounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"formula" varchar(120),
	"molecular_weight" double precision,
	"smiles" text,
	"iupac_name" text,
	"cid" varchar(50),
	"source" varchar(120),
	"source_url" text,
	"retrieved_at" timestamp DEFAULT now(),
	"body" jsonb,
	CONSTRAINT "chemical_compounds_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."clinical_trials" (
	"id" serial PRIMARY KEY NOT NULL,
	"nct_id" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"status" varchar(80),
	"phase" jsonb,
	"conditions" jsonb,
	"locations" jsonb,
	"url" text,
	"source" varchar(120),
	"retrieved_at" timestamp DEFAULT now(),
	"body" jsonb,
	CONSTRAINT "clinical_trials_nct_id_unique" UNIQUE("nct_id")
);
--> statement-breakpoint
CREATE TABLE "health"."data_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"provider" varchar(120) NOT NULL,
	"url" text,
	"license" varchar(255),
	"attribution" text,
	"reliability_level" varchar(40) DEFAULT 'medium',
	"update_frequency" varchar(80),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "data_sources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "health"."data_sync_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(120) NOT NULL,
	"job_type" varchar(80) NOT NULL,
	"status" varchar(40) DEFAULT 'pending',
	"progress" integer DEFAULT 0,
	"total" integer DEFAULT 0,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error" text,
	"logs" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."disease_aliases" (
	"id" serial PRIMARY KEY NOT NULL,
	"disease_slug" varchar(200) NOT NULL,
	"alias" varchar(255) NOT NULL,
	"language" varchar(10) DEFAULT 'en'
);
--> statement-breakpoint
CREATE TABLE "health"."disease_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"disease_slug" varchar(200) NOT NULL,
	"code" varchar(50) NOT NULL,
	"system" varchar(20) NOT NULL,
	"display" varchar(255),
	"definition" text,
	"source" varchar(120),
	"source_url" text
);
--> statement-breakpoint
CREATE TABLE "health"."drug_adverse_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"drug_slug" varchar(200) NOT NULL,
	"reaction" text NOT NULL,
	"frequency" varchar(80),
	"source" varchar(120)
);
--> statement-breakpoint
CREATE TABLE "health"."drug_aliases" (
	"id" serial PRIMARY KEY NOT NULL,
	"drug_slug" varchar(200) NOT NULL,
	"alias" varchar(255) NOT NULL,
	"type" varchar(40)
);
--> statement-breakpoint
CREATE TABLE "health"."drug_contraindications" (
	"id" serial PRIMARY KEY NOT NULL,
	"drug_slug" varchar(200) NOT NULL,
	"contraindication" text NOT NULL,
	"source" varchar(120)
);
--> statement-breakpoint
CREATE TABLE "health"."drug_dosages" (
	"id" serial PRIMARY KEY NOT NULL,
	"drug_slug" varchar(200) NOT NULL,
	"dosage" text NOT NULL,
	"population" varchar(120),
	"source" varchar(120)
);
--> statement-breakpoint
CREATE TABLE "health"."drug_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"drug_slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"strength" varchar(120)
);
--> statement-breakpoint
CREATE TABLE "health"."drug_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"drug_slug" varchar(200) NOT NULL,
	"interacts_with" varchar(255) NOT NULL,
	"description" text,
	"severity" varchar(40),
	"source" varchar(120)
);
--> statement-breakpoint
CREATE TABLE "health"."drug_warnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"drug_slug" varchar(200) NOT NULL,
	"warning" text NOT NULL,
	"severity" varchar(40),
	"source" varchar(120)
);
--> statement-breakpoint
CREATE TABLE "health"."equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(255) NOT NULL,
	"source" varchar(120),
	"source_id" varchar(120),
	CONSTRAINT "equipment_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."exercise_equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"exercise_id" integer NOT NULL,
	"equipment_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health"."exercise_muscles" (
	"id" serial PRIMARY KEY NOT NULL,
	"exercise_id" integer NOT NULL,
	"muscle_id" integer NOT NULL,
	"is_secondary" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "health"."exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(120),
	"difficulty" varchar(40),
	"images" jsonb,
	"source" varchar(120),
	"source_id" varchar(200),
	"source_url" text,
	"license" varchar(255),
	"retrieved_at" timestamp DEFAULT now(),
	"body" jsonb,
	CONSTRAINT "exercises_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."food_allergens" (
	"id" serial PRIMARY KEY NOT NULL,
	"food_id" integer NOT NULL,
	"allergen" varchar(120) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health"."food_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"food_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"position" integer
);
--> statement-breakpoint
CREATE TABLE "health"."food_nutrients" (
	"id" serial PRIMARY KEY NOT NULL,
	"food_id" integer NOT NULL,
	"calories" double precision,
	"protein" double precision,
	"carbs" double precision,
	"fat" double precision,
	"fiber" double precision,
	"sugar" double precision,
	"sodium" double precision,
	"saturated_fat" double precision,
	"per_100g" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "health"."foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"brand" varchar(255),
	"barcode" varchar(50),
	"category" varchar(120),
	"serving_size" varchar(120),
	"image" text,
	"nutri_score" varchar(5),
	"nova_group" integer,
	"source" varchar(120),
	"source_id" varchar(200),
	"source_url" text,
	"license" varchar(255),
	"retrieved_at" timestamp DEFAULT now(),
	"last_updated" timestamp DEFAULT now(),
	"data_version" varchar(80),
	"body" jsonb,
	CONSTRAINT "foods_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."homeopathic_remedies" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"common_names" jsonb,
	"scientific_name" varchar(255),
	"materia_medica_ref" varchar(255),
	"traditional_indications" jsonb,
	"potency_info" text,
	"source" varchar(120),
	"source_id" varchar(200),
	"license" varchar(255),
	"retrieved_at" timestamp DEFAULT now(),
	"body" jsonb,
	CONSTRAINT "homeopathic_remedies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."indian_medicines" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"generic_composition" text,
	"dosage_form" varchar(120),
	"manufacturer" varchar(255),
	"pharmacological_info" text,
	"source" varchar(120),
	"source_id" varchar(200),
	"source_url" text,
	"license" varchar(255),
	"retrieved_at" timestamp DEFAULT now(),
	"body" jsonb,
	CONSTRAINT "indian_medicines_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."medical_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(300) NOT NULL,
	"pmid" varchar(20),
	"title" text NOT NULL,
	"authors" jsonb,
	"journal" varchar(255),
	"pub_date" varchar(50),
	"abstract" text,
	"url" text,
	"doi" varchar(255),
	"source" varchar(120),
	"source_url" text,
	"retrieved_at" timestamp DEFAULT now(),
	"body" jsonb,
	CONSTRAINT "medical_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."muscles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_front" boolean,
	"image" text,
	"source" varchar(120),
	"source_id" varchar(120),
	CONSTRAINT "muscles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."user_health_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"age" integer,
	"gender" varchar(20),
	"height_cm" double precision,
	"weight_kg" double precision,
	"bmi" double precision,
	"goals" jsonb,
	"conditions" jsonb,
	"allergies" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."user_measurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(80) NOT NULL,
	"value" double precision NOT NULL,
	"unit" varchar(40),
	"measured_at" timestamp DEFAULT now(),
	"source" varchar(120),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "health"."user_nutrition_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"food_id" integer,
	"quantity" double precision,
	"unit" varchar(40),
	"calories" double precision,
	"protein" double precision,
	"carbs" double precision,
	"fat" double precision,
	"logged_at" timestamp DEFAULT now(),
	"body" jsonb
);
--> statement-breakpoint
CREATE TABLE "health"."user_workout_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"workout_id" integer,
	"exercise_id" integer,
	"duration_minutes" integer,
	"calories_burned" integer,
	"performed_at" timestamp DEFAULT now(),
	"body" jsonb
);
--> statement-breakpoint
CREATE TABLE "health"."workout_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"workout_id" integer NOT NULL,
	"exercise_id" integer NOT NULL,
	"sets" integer,
	"reps" varchar(80),
	"rest_seconds" integer,
	"position" integer
);
--> statement-breakpoint
CREATE TABLE "health"."workout_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"difficulty" varchar(40),
	"days_per_week" integer,
	"source" varchar(120),
	"body" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "workout_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "health"."ad_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot_id" varchar(120) NOT NULL,
	"type" varchar(20) DEFAULT 'impression' NOT NULL,
	"page" varchar(500),
	"network" varchar(60) DEFAULT 'adsense',
	"revenue_paise" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."affiliate_clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" varchar(120) NOT NULL,
	"slug" varchar(255),
	"destination_url" text,
	"page" varchar(500),
	"utm_source" varchar(120),
	"utm_medium" varchar(120),
	"utm_campaign" varchar(160),
	"utm_content" varchar(160),
	"utm_term" varchar(160),
	"referrer" text,
	"visitor_hash" varchar(64),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."affiliate_conversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"click_id" integer,
	"product_id" varchar(120) NOT NULL,
	"network" varchar(80),
	"order_value_paise" integer,
	"commission_paise" integer DEFAULT 0 NOT NULL,
	"currency" varchar(8) DEFAULT 'INR',
	"status" varchar(40) DEFAULT 'reported' NOT NULL,
	"reported_at" timestamp DEFAULT now(),
	"confirmed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "health"."affiliate_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"product_id" varchar(120) NOT NULL,
	"title" varchar(500) NOT NULL,
	"merchant" varchar(120),
	"network" varchar(80),
	"category" varchar(120),
	"image_url" text,
	"commission_bps" integer DEFAULT 800 NOT NULL,
	"price_paise" integer,
	"currency" varchar(8) DEFAULT 'INR',
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(80) NOT NULL,
	"description" text,
	"discount_type" varchar(20) DEFAULT 'percent' NOT NULL,
	"discount_value" integer DEFAULT 0 NOT NULL,
	"max_redemptions" integer,
	"redemption_count" integer DEFAULT 0 NOT NULL,
	"min_order_paise" integer DEFAULT 0,
	"active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."digital_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" varchar(120) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"storage_key" text NOT NULL,
	"storage_driver" varchar(20) DEFAULT 'local' NOT NULL,
	"file_name" varchar(255),
	"file_size" varchar(40),
	"format" varchar(20) DEFAULT 'PDF',
	"download_limit" integer DEFAULT 3 NOT NULL,
	"expires_in_hours" integer DEFAULT 72 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."download_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(255) NOT NULL,
	"order_id" varchar(120) NOT NULL,
	"product_id" varchar(120) NOT NULL,
	"outcome" varchar(20) NOT NULL,
	"actor_hash" varchar(64),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."download_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(255) NOT NULL,
	"order_id" varchar(120) NOT NULL,
	"product_id" varchar(120) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"max_downloads" integer DEFAULT 3 NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"phone" varchar(40),
	"form_type" varchar(80) DEFAULT 'diet-consultation' NOT NULL,
	"message" text,
	"city" varchar(120),
	"value_paise" integer DEFAULT 25000,
	"status" varchar(40) DEFAULT 'new' NOT NULL,
	"consent" boolean DEFAULT false NOT NULL,
	"page" varchar(500),
	"attribution" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."monetization_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(120),
	"type" varchar(60) NOT NULL,
	"page" varchar(500),
	"product_id" varchar(120),
	"campaign" varchar(160),
	"source" varchar(160),
	"cta" varchar(255),
	"ab" jsonb,
	"utm" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar(120) NOT NULL,
	"product_id" varchar(120) NOT NULL,
	"product_slug" varchar(255),
	"title" varchar(500),
	"product_type" varchar(40) DEFAULT 'digital' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_paise" integer DEFAULT 0 NOT NULL,
	"total_paise" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar(120) NOT NULL,
	"email" varchar(255) NOT NULL,
	"user_id" varchar(120),
	"status" varchar(40) DEFAULT 'created' NOT NULL,
	"provider" varchar(40) DEFAULT 'razorpay' NOT NULL,
	"provider_order_id" varchar(255),
	"provider_payment_id" varchar(255),
	"amount_paise" integer DEFAULT 0 NOT NULL,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"coupon_code" varchar(80),
	"discount_paise" integer DEFAULT 0 NOT NULL,
	"attribution" jsonb,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."premium_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(120),
	"email" varchar(255) NOT NULL,
	"plan" varchar(60) DEFAULT 'monthly' NOT NULL,
	"amount_paise" integer DEFAULT 19900 NOT NULL,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"status" varchar(40) DEFAULT 'pending' NOT NULL,
	"provider" varchar(40) DEFAULT 'razorpay' NOT NULL,
	"provider_subscription_id" varchar(255),
	"provider_customer_id" varchar(255),
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancelled_at" timestamp,
	"attribution" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"key_id" varchar(64) NOT NULL,
	"name" varchar(120) DEFAULT 'Default key' NOT NULL,
	"owner_id" varchar(120),
	"owner_email" varchar(255),
	"plan" varchar(40) DEFAULT 'free' NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"key_prefix" varchar(24) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"environment" varchar(12) DEFAULT 'live' NOT NULL,
	"scopes" jsonb,
	"request_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"revoked_at" timestamp,
	CONSTRAINT "api_keys_key_id_unique" UNIQUE("key_id"),
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "health"."api_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" varchar(120),
	"email" varchar(255) NOT NULL,
	"plan" varchar(40) DEFAULT 'free' NOT NULL,
	"amount_paise" integer DEFAULT 0 NOT NULL,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"status" varchar(40) DEFAULT 'active' NOT NULL,
	"provider" varchar(40) DEFAULT 'mock' NOT NULL,
	"provider_order_id" varchar(255),
	"provider_subscription_id" varchar(255),
	"demo" boolean DEFAULT false NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"invoice_paid" boolean DEFAULT false NOT NULL,
	"attribution" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."api_usage_daily" (
	"id" serial PRIMARY KEY NOT NULL,
	"key_id" varchar(64) NOT NULL,
	"day" varchar(10) NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"by_endpoint" jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "health"."api_usage_endpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"key_id" varchar(64) NOT NULL,
	"day" varchar(10) NOT NULL,
	"endpoint" varchar(200) NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "api_request_logs_provider_idx" ON "health"."api_request_logs" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "api_request_logs_created_at_idx" ON "health"."api_request_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "clinical_trials_nct_id_idx" ON "health"."clinical_trials" USING btree ("nct_id");--> statement-breakpoint
CREATE INDEX "exercises_name_idx" ON "health"."exercises" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "foods_barcode_idx" ON "health"."foods" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "foods_name_idx" ON "health"."foods" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "medical_articles_pmid_idx" ON "health"."medical_articles" USING btree ("pmid");--> statement-breakpoint
CREATE INDEX "ad_events_slot_idx" ON "health"."ad_events" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX "ad_events_type_idx" ON "health"."ad_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ad_events_created_at_idx" ON "health"."ad_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "affiliate_clicks_product_idx" ON "health"."affiliate_clicks" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "affiliate_clicks_created_at_idx" ON "health"."affiliate_clicks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "affiliate_clicks_campaign_idx" ON "health"."affiliate_clicks" USING btree ("utm_campaign");--> statement-breakpoint
CREATE INDEX "affiliate_conversions_product_idx" ON "health"."affiliate_conversions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "affiliate_conversions_status_idx" ON "health"."affiliate_conversions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "affiliate_products_slug_idx" ON "health"."affiliate_products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "affiliate_products_active_idx" ON "health"."affiliate_products" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_code_idx" ON "health"."coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupons_active_idx" ON "health"."coupons" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "digital_products_product_idx" ON "health"."digital_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "digital_products_slug_idx" ON "health"."digital_products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "download_audit_order_idx" ON "health"."download_audit" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "download_audit_token_idx" ON "health"."download_audit" USING btree ("token");--> statement-breakpoint
CREATE INDEX "download_audit_created_at_idx" ON "health"."download_audit" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "download_tokens_token_idx" ON "health"."download_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "download_tokens_order_idx" ON "health"."download_tokens" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "health"."leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "leads_form_idx" ON "health"."leads" USING btree ("form_type");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "health"."leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "monetization_events_type_idx" ON "health"."monetization_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "monetization_events_created_at_idx" ON "health"."monetization_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "monetization_events_page_idx" ON "health"."monetization_events" USING btree ("page");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "health"."order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "health"."order_items" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_order_id_idx" ON "health"."orders" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_email_idx" ON "health"."orders" USING btree ("email");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "health"."orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "premium_subscriptions_email_idx" ON "health"."premium_subscriptions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "premium_subscriptions_status_idx" ON "health"."premium_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "premium_subscriptions_provider_sub_idx" ON "health"."premium_subscriptions" USING btree ("provider_subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_hash_idx" ON "health"."api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_owner_idx" ON "health"."api_keys" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "api_keys_email_idx" ON "health"."api_keys" USING btree ("owner_email");--> statement-breakpoint
CREATE INDEX "api_keys_status_idx" ON "health"."api_keys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "api_subscriptions_email_idx" ON "health"."api_subscriptions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "api_subscriptions_status_idx" ON "health"."api_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "api_usage_key_day_idx" ON "health"."api_usage_daily" USING btree ("key_id","day");--> statement-breakpoint
CREATE INDEX "api_usage_day_idx" ON "health"."api_usage_daily" USING btree ("day");--> statement-breakpoint
CREATE UNIQUE INDEX "api_usage_endpoint_idx" ON "health"."api_usage_endpoints" USING btree ("key_id","day","endpoint");--> statement-breakpoint
CREATE INDEX "api_usage_endpoint_day_idx" ON "health"."api_usage_endpoints" USING btree ("day");
--> statement-breakpoint
-- Lock the schema down: only the app's server connection (postgres role) uses it.
-- The schema is not exposed through Supabase's REST API, and RLS without policies
-- blocks anon/authenticated even if it ever were.
REVOKE ALL ON SCHEMA "health" FROM anon, authenticated;
--> statement-breakpoint
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'health' LOOP
    EXECUTE format('ALTER TABLE "health".%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
