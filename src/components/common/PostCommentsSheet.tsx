import {supabase} from '@/lib/supabase';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useAuth} from '@/contexts/AuthContext';
import * as S from './PostCommentsSheet.style';
import {Comment, CommentWithReplies} from '@/@types/database';
import ActionSheetModal, {ActionSheetAction} from '@/components/modal/ActionSheetModal';
import InSheetActionSheet from './InSheetActionSheet';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import {POST_ROUTES} from '@/constants/navigation.constant';
import {trackEvent} from '@/lib/mixpanel';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

// ActionSheetModal의 시트 하단 safe-area 패딩(ActionSheetModal.tsx styles.sheet)과 동일한 값.
// 키보드가 그 여백보다 더 올라온 만큼만 바텀시트를 밀어올려서, 패딩+키보드 간 빈 틈이 생기지 않게 함
const SHEET_BOTTOM_PADDING = 34;

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(isoString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface PostCommentsSheetProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postOwnerId: string;
  postContent: string | null;
  projectId: string;
  projectTitle: string;
  onCommentsCountChange?: (count: number) => void;
}

// 게시물 상세, 홈 피드 등 여러 화면에서 공용으로 쓰는 댓글 바텀시트.
// 목록/작성/답글/수정/삭제/숨기기/신고를 전부 포함 — 원래 PostDetailScreen에 있던
// 댓글 로직을 그대로 추출한 것(화면마다 postId/postOwnerId/프로젝트 정보만 다름)
export default function PostCommentsSheet({
  visible,
  onClose,
  postId,
  postOwnerId,
  postContent,
  projectId,
  projectTitle,
  onCommentsCountChange,
}: PostCommentsSheetProps) {
  const {navigation} = useCommonNavigation<any>();
  const {user} = useAuth();
  const commentInputRef = useRef<TextInput>(null);

  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{id: string; nickname: string} | null>(null);
  const [editingTarget, setEditingTarget] = useState<Comment | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentMenuTarget, setCommentMenuTarget] = useState<Comment | null>(null);
  const [showCommentActionSheet, setShowCommentActionSheet] = useState(false);
  const [reportTarget, setReportTarget] = useState<{id: string; content: string} | null>(null);
  const [showReportReasonSheet, setShowReportReasonSheet] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, e =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      // postId가 바뀐 채로 재사용되는 공용 인스턴스(홈 피드 등)라, 새로 열릴 때마다
      // 이전 게시물의 댓글 목록이 한 프레임이라도 그대로 보이지 않도록 바로 비움
      setComments([]);
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, postId]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const {data: commentsData, error: commentsError} = await supabase
        .from('comments')
        .select(
          `
          id,
          post_id,
          user_id,
          parent_comment_id,
          content,
          is_hidden,
          is_edited,
          created_at,
          updated_at,
          users!comments_user_id_fkey!inner(nickname, profile_image)
        `,
        )
        .eq('post_id', postId)
        .order('created_at', {ascending: true});

      if (commentsError) throw commentsError;

      let blockedIds: string[] = [];
      if (user) {
        const {data: blocksData} = await supabase
          .from('blocks')
          .select('blocked_id')
          .eq('blocker_id', user.id);
        blockedIds = (blocksData || []).map((b: any) => b.blocked_id);
      }

      const flat: Comment[] = (commentsData || [])
        .map((c: any) => ({
          id: c.id,
          post_id: c.post_id,
          user_id: c.user_id,
          parent_comment_id: c.parent_comment_id,
          content: c.content,
          is_hidden: c.is_hidden,
          is_edited: c.is_edited,
          created_at: c.created_at,
          updated_at: c.updated_at,
          nickname: c.users.nickname,
          profile_image: c.users.profile_image,
        }))
        .filter((c: Comment) => !blockedIds.includes(c.user_id));

      const topLevel = flat.filter(c => !c.parent_comment_id);
      const tree: CommentWithReplies[] = topLevel.map(top => ({
        ...top,
        replies: flat.filter(c => c.parent_comment_id === top.id),
      }));

      setComments(tree);
      onCommentsCountChange?.(flat.length);
    } catch (error) {
      console.error('❌ 댓글 로드 실패:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleStartReply = (comment: Comment) => {
    setEditingTarget(null);
    setCommentText('');
    setReplyingTo({id: comment.parent_comment_id ?? comment.id, nickname: comment.nickname});
    commentInputRef.current?.focus();
  };

  const handleStartEditComment = (comment: Comment) => {
    setReplyingTo(null);
    setEditingTarget(comment);
    setCommentText(comment.content);
    commentInputRef.current?.focus();
  };

  const handleCancelReplyOrEdit = () => {
    setReplyingTo(null);
    setEditingTarget(null);
    setCommentText('');
  };

  const handleClose = () => {
    onClose();
    handleCancelReplyOrEdit();
  };

  const handlePressMention = (userId: string) => {
    handleClose();
    navigation.push(POST_ROUTES.POSTS_MAIN, {userId});
  };

  const handleSubmitComment = async () => {
    if (!user || isSubmittingComment) return;
    const trimmed = commentText.trim();
    if (!trimmed) return;

    setIsSubmittingComment(true);
    try {
      if (editingTarget) {
        const {error} = await supabase
          .from('comments')
          .update({content: trimmed, is_edited: true, updated_at: new Date().toISOString()})
          .eq('id', editingTarget.id);
        if (error) throw error;
        trackEvent('comment_edited', {post_id: postId, comment_id: editingTarget.id});
      } else {
        const content = replyingTo ? `@${replyingTo.nickname} ${trimmed}` : trimmed;
        const {error} = await supabase.from('comments').insert({
          post_id: postId,
          user_id: user.id,
          parent_comment_id: replyingTo?.id ?? null,
          content,
        });
        if (error) throw error;
        trackEvent('comment_posted', {post_id: postId, is_reply: !!replyingTo});
      }
      setCommentText('');
      setReplyingTo(null);
      setEditingTarget(null);
      await fetchComments();
    } catch (error: any) {
      console.error('❌ 댓글 처리 실패:', error);
      Alert.alert('오류', error?.message ?? '댓글 처리 중 문제가 발생했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('댓글 삭제', '정말 이 댓글을 삭제하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const {error} = await supabase.from('comments').delete().eq('id', commentId);
            if (error) throw error;
            await fetchComments();
          } catch (error) {
            console.error('❌ 댓글 삭제 실패:', error);
            Alert.alert('오류', '댓글 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const handleHideComment = async (commentId: string) => {
    try {
      const {error} = await supabase.from('comments').update({is_hidden: true}).eq('id', commentId);
      if (error) throw error;
      await fetchComments();
    } catch (error) {
      console.error('❌ 댓글 숨기기 실패:', error);
      Alert.alert('오류', '댓글을 숨기는 중 문제가 발생했습니다.');
    }
  };

  const handleOpenCommentReport = (comment: Comment) => {
    setReportTarget({id: comment.id, content: comment.content});
    // InSheetActionSheet가 "신고하기" 탭 이후 자기 닫힘 애니메이션까지 기다렸다가
    // 이 함수를 호출해주므로, 여기서 또 지연시킬 필요 없이 바로 다음 시트를 열면 됨
    setShowReportReasonSheet(true);
  };

  const handleReport = async (reason: string) => {
    if (!user || !reportTarget) return;
    try {
      setIsReporting(true);
      const {error: insertError} = await supabase.from('reports').insert({
        reporter_id: user.id,
        post_id: postId,
        reason,
        project_id: projectId,
        project_title: projectTitle,
        comment_id: reportTarget.id,
        reported_content_snapshot: reportTarget.content,
      });
      if (insertError) {
        if (insertError.code === '23505') {
          Alert.alert('알림', '이미 신고한 댓글입니다.');
          return;
        }
        throw insertError;
      }
      trackEvent('comment_reported', {post_id: postId, reason, comment_id: reportTarget.id});
      const {error: fnError} = await supabase.functions.invoke('send-report-email', {
        body: {
          reporterId: user.id,
          reporterNickname: user.nickname ?? '알 수 없음',
          postId,
          postContent,
          projectId,
          projectTitle,
          reportType: 'comment',
          commentId: reportTarget.id,
          commentContent: reportTarget.content,
          reason,
        },
      });
      if (fnError) {
        console.error('❌ 신고 이메일 발송 실패:', fnError);
      }
      Alert.alert('신고 완료', '신고가 접수되었습니다. 24시간 내에 검토 후 처리하겠습니다.');
    } catch (error) {
      console.error('❌ 신고 실패:', error);
      Alert.alert('오류', '신고 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsReporting(false);
      setShowReportReasonSheet(false);
      setReportTarget(null);
    }
  };

  const renderCommentRow = (
    comment: Comment,
    isReply: boolean,
    parentAuthor?: {id: string; nickname: string},
  ) => {
    // 답글 작성 시 content 맨 앞에 "@닉네임 "을 붙여서 저장해둔 걸 분리해서
    // 멘션 부분만 따로 스타일링(평문화 방지용 — DB엔 parent_comment_id만 있어서
    // 누구에게 단 답글인지는 이 텍스트 태그로만 구분됨). 답글은 항상 원댓글(top-level)
    // 작성자에게만 달리므로(1단계 제한), parentAuthor는 그 원댓글 작성자 정보 — 멘션
    // 텍스트가 그 닉네임으로 시작할 때만 탭해서 프로필로 이동 가능하게 함
    const mentionPrefix = parentAuthor ? `@${parentAuthor.nickname} ` : null;
    const hasMention = isReply && !!mentionPrefix && comment.content.startsWith(mentionPrefix);
    const restContent = hasMention ? comment.content.slice(mentionPrefix!.length) : comment.content;

    const avatarSizeStyle = isReply
      ? {width: 24, height: 24, borderRadius: 12}
      : undefined;

    return (
      <S.CommentRow key={comment.id} style={isReply ? {marginLeft: 44} : undefined}>
        {comment.profile_image ? (
          <S.CommentAvatar
            source={{uri: comment.profile_image}}
            style={avatarSizeStyle}
          />
        ) : (
          <S.CommentAvatarPlaceholder style={avatarSizeStyle}>
            <S.CommentAvatarPlaceholderText>
              {comment.nickname.charAt(0)}
            </S.CommentAvatarPlaceholderText>
          </S.CommentAvatarPlaceholder>
        )}
        <S.CommentBody>
          <S.CommentHeaderRow>
            <S.CommentHeaderLeft>
              <S.CommentNickname>{comment.nickname}</S.CommentNickname>
              <S.CommentTime>{formatRelativeTime(comment.created_at)}</S.CommentTime>
            </S.CommentHeaderLeft>
            {user && (
              <TouchableOpacity
                onPress={() => {
                  setCommentMenuTarget(comment);
                  setShowCommentActionSheet(true);
                }}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <S.CommentMoreButton>⋯</S.CommentMoreButton>
              </TouchableOpacity>
            )}
          </S.CommentHeaderRow>
          <S.CommentContent>
            {hasMention && (
              <S.CommentMention
                suppressHighlighting
                onPress={() => handlePressMention(parentAuthor!.id)}>
                @{parentAuthor!.nickname}{' '}
              </S.CommentMention>
            )}
            {restContent}
            {comment.is_edited && <S.CommentEditedMark>  (수정됨)</S.CommentEditedMark>}
          </S.CommentContent>
          {!isReply && (
            <S.CommentReplyButton onPress={() => handleStartReply(comment)}>
              <S.CommentReplyButtonText>답글</S.CommentReplyButtonText>
            </S.CommentReplyButton>
          )}
        </S.CommentBody>
      </S.CommentRow>
    );
  };

  const keyboardOverlap = Math.max(0, keyboardHeight - SHEET_BOTTOM_PADDING);

  const isCommentMenuTargetAuthor =
    !!user && !!commentMenuTarget && commentMenuTarget.user_id === user.id;
  const isPostOwnerForCommentMenu =
    !!user && !isCommentMenuTargetAuthor && postOwnerId === user.id;

  const commentMenuActions: ActionSheetAction[] = commentMenuTarget
    ? isCommentMenuTargetAuthor
      ? // 1) 댓글 작성자 본인 → 수정/삭제
        [
          {label: '수정하기', onPress: () => handleStartEditComment(commentMenuTarget)},
          {
            label: '삭제하기',
            onPress: () => handleDeleteComment(commentMenuTarget.id),
            isDestructive: true,
          },
        ]
      : isPostOwnerForCommentMenu
      ? // 2) 게시물 소유자(댓글 작성자는 아님) → 숨기기/신고하기
        [
          {label: '숨기기', onPress: () => handleHideComment(commentMenuTarget.id)},
          {
            label: '신고하기',
            onPress: () => handleOpenCommentReport(commentMenuTarget),
            isDestructive: true,
          },
        ]
      : // 3) 그 외 타인 → 신고하기만
        [
          {
            label: '신고하기',
            onPress: () => handleOpenCommentReport(commentMenuTarget),
            isDestructive: true,
          },
        ]
    : [];

  const reportReasonActions: ActionSheetAction[] = [
    {label: '스팸', onPress: () => handleReport('스팸')},
    {label: '부적절한 콘텐츠', onPress: () => handleReport('부적절한 콘텐츠'), isDestructive: true},
    {label: '저작권 침해', onPress: () => handleReport('저작권 침해'), isDestructive: true},
    {label: '기타', onPress: () => handleReport('기타')},
  ];

  return (
    <ActionSheetModal visible={visible} onClose={handleClose} showCancel={false} hideHandle>
      <View
        style={{
          height: SCREEN_HEIGHT * 0.65 - keyboardOverlap,
          marginBottom: keyboardOverlap,
        }}>
        <S.ActionSheetHandle />
        <S.CommentsSheetHeader>
          <S.CommentsSheetTitle>댓글</S.CommentsSheetTitle>
        </S.CommentsSheetHeader>
        <S.CommentsSheetList keyboardShouldPersistTaps="handled">
          {loadingComments ? (
            <ActivityIndicator size="small" color="#999" style={{paddingVertical: 40}} />
          ) : comments.length === 0 ? (
            <S.CommentsEmptyText>첫 댓글을 남겨보세요.</S.CommentsEmptyText>
          ) : (
            comments.map(comment => (
              <React.Fragment key={comment.id}>
                {renderCommentRow(comment, false)}
                {comment.replies.map(reply =>
                  renderCommentRow(reply, true, {
                    id: comment.user_id,
                    nickname: comment.nickname,
                  }),
                )}
              </React.Fragment>
            ))
          )}
        </S.CommentsSheetList>
        {(replyingTo || editingTarget) && (
          <S.ReplyingToChip>
            <S.ReplyingToText>
              {editingTarget ? '댓글 수정 중' : `@${replyingTo?.nickname}님에게 답글`}
            </S.ReplyingToText>
            <TouchableOpacity onPress={handleCancelReplyOrEdit}>
              <S.ReplyingToCancel>취소</S.ReplyingToCancel>
            </TouchableOpacity>
          </S.ReplyingToChip>
        )}
        <S.InputBar>
          <S.CommentInput
            ref={commentInputRef}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="댓글을 입력하세요"
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
          />
          <S.CommentSendButton
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || isSubmittingComment}>
            <S.CommentSendButtonText>
              {editingTarget ? '수정' : '게시'}
            </S.CommentSendButtonText>
          </S.CommentSendButton>
        </S.InputBar>

        <InSheetActionSheet
          visible={showCommentActionSheet}
          onClose={() => setShowCommentActionSheet(false)}
          actions={commentMenuActions}
        />

        {/* 댓글 신고 사유 — 댓글 바텀시트가 떠있는 상태에서 Modal을 또 띄우면
        중첩 Modal 문제로 안 보일 수 있어서 같은 방식(InSheetActionSheet)으로 처리 */}
        <InSheetActionSheet
          visible={showReportReasonSheet}
          onClose={() => setShowReportReasonSheet(false)}
          actions={reportReasonActions}
        />

        {isReporting && (
          <S.ActionLoadingOverlay>
            <ActivityIndicator size="large" color="#fff" />
            <S.ActionLoadingText>신고 접수 중...</S.ActionLoadingText>
          </S.ActionLoadingOverlay>
        )}
      </View>
    </ActionSheetModal>
  );
}
