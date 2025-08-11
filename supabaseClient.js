import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qiomtafktfekejkiwfxl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpb210YWZrdGZla2Vqa2l3ZnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NzkyMDEsImV4cCI6MjA2ODA1NTIwMX0.KGvPL2T6yIWBcbvmqtaLBn__RSzX-4mZnZlN6JN7U0g'

export const supabase = createClient(supabaseUrl, supabaseKey)