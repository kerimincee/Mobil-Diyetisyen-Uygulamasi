import { createClient } from '@supabase/supabase-js'

// Yeni Supabase Projesi Bilgileri
const supabaseUrl = 'https://jjvvtacpxnsohxjgrrwe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdnZ0YWNweG5zb2h4amdycndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0Mjg3ODIsImV4cCI6MjA3MTAwNDc4Mn0.pgdDZr7zLL-y1EutDWKV3sUthVKFUDhfTN6gN7NPItA'

export const supabase = createClient(supabaseUrl, supabaseKey)