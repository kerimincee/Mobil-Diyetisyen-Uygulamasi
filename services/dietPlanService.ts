import { supabase } from '../supabaseClient';

export async function addDietPlan({ user_id, date, breakfast, snack1, lunch, snack2, dinner }: {
  user_id: string;
  date: string; // 'YYYY-MM-DD'
  breakfast?: string;
  snack1?: string;
  lunch?: string;
  snack2?: string;
  dinner?: string;
}) {
  const { data, error } = await supabase.from('diet_plans').upsert({
    user_id,
    date,
    breakfast,
    snack1,
    lunch,
    snack2,
    dinner,
  }, { onConflict: 'user_id,date' }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getDietPlanByDate(user_id: string, date: string) {
  const { data, error } = await supabase
    .from('diet_plans')
    .select('*')
    .eq('user_id', user_id)
    .eq('date', date)
    .single();
  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
}

export async function deleteDietPlan(user_id: string, date: string) {
  const { error } = await supabase
    .from('diet_plans')
    .delete()
    .eq('user_id', user_id)
    .eq('date', date);
  if (error) throw new Error(error.message);
}

export async function updateDietPlan({ user_id, date, breakfast, snack1, lunch, snack2, dinner }: {
  user_id: string;
  date: string;
  breakfast?: string;
  snack1?: string;
  lunch?: string;
  snack2?: string;
  dinner?: string;
}) {
  const { data, error } = await supabase.from('diet_plans').update({
    breakfast,
    snack1,
    lunch,
    snack2,
    dinner,
  }).eq('user_id', user_id).eq('date', date).select().single();
  if (error) throw new Error(error.message);
  return data;
} 