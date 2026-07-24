CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "reporter_id" "uuid" NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "post_id" "uuid" NOT NULL REFERENCES "public"."posts"("id") ON DELETE CASCADE,
    "reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."reports" OWNER TO "postgres";

ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reports" ON "public"."reports"
    FOR INSERT TO "authenticated"
    WITH CHECK ("reporter_id" = "auth"."uid"());

CREATE POLICY "Users can view own reports" ON "public"."reports"
    FOR SELECT TO "authenticated"
    USING ("reporter_id" = "auth"."uid"());
