import { supabase } from '../supabaseClient';

export async function addMeal({ food_name, calorie, image_url, user_id }: {
  food_name: string;
  calorie: number;
  image_url?: string;
  user_id: string;
}) {
  const { data, error } = await supabase.from('meals').insert({
    food_name,
    calorie,
    image_url,
    user_id,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getMealsByUser(user_id: string) {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
} 