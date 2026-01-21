// utils/postUtils.ts
import {supabase} from '@/lib/supabase';

export const completePost = async (
  postId: string,
  visibility: 'public' | 'private'
) => {
  try {
    const {data, error} = await supabase
      .from('posts')
      .update({
        is_completed: true,
        visibility: visibility,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;

    return {success: true, data};
  } catch (error) {
    console.error('프로젝트 완료 처리 실패:', error);
    return {success: false, error};
  }
};