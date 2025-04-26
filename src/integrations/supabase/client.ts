import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wfgiteinosyqlezrtuly.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZ2l0ZWlub3N5cWxlenJ0dWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODA4NTAsImV4cCI6MjA2MDA1Njg1MH0.Ytaihj8pfc3VaVAKwctEZV0s-1ziDhE9hABi2d5sQOI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
