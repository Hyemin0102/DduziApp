CREATE TABLE IF NOT EXISTS "public"."blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "blocker_id" "uuid" NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "blocked_id" "uuid" NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"(),
    UNIQUE("blocker_id", "blocked_id")
);

ALTER TABLE "public"."blocks" OWNER TO "postgres";

ALTER TABLE "public"."blocks" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own blocks" ON "public"."blocks"
    FOR INSERT TO "authenticated"
    WITH CHECK ("blocker_id" = "auth"."uid"());

CREATE POLICY "Users can view own blocks" ON "public"."blocks"
    FOR SELECT TO "authenticated"
    USING ("blocker_id" = "auth"."uid"());

CREATE POLICY "Users can delete own blocks" ON "public"."blocks"
    FOR DELETE TO "authenticated"
    USING ("blocker_id" = "auth"."uid"());
