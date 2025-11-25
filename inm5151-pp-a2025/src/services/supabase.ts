import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jdwoyeetxbabbuwqqfwc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkd295ZWV0eGJhYmJ1d3FxZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NDgwMjQsImV4cCI6MjA3NzUyNDAyNH0.SFmfsCLIB9P78OBIYXRzsyXV2sMZ36OyfNCB2TrHlhg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
