CREATE TABLE IF NOT EXISTS "public"."feedbacks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."feedbacks" OWNER TO "postgres";

ALTER TABLE "public"."feedbacks" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON "public"."feedbacks"
    FOR INSERT TO "authenticated"
    WITH CHECK ("user_id" = "auth"."uid"());

CREATE POLICY "Users can view own feedback" ON "public"."feedbacks"
    FOR SELECT TO "authenticated"
    USING ("user_id" = "auth"."uid"());
