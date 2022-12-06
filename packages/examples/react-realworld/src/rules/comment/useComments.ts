import { useEffect, useState } from 'react';
import { commentRule, currentCommentRule } from './comment';

export const useComments = (slug: string) => {
  const filter = {
    $comment: {
      slug: [slug],
    },
  };

  const [comments, setComments] = useState(commentRule.query(filter));

  useEffect(() => {
    return commentRule.subscribe((c) => setComments(c));
  });
  return comments
    .map((c) => c.$comment)
    .sort((a, b) => {
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
};

export const useCommentSection = (slug: string) => {
  const comments = useComments(slug);

  const [currentComment, setCurrentComment] = useState(
    currentCommentRule.queryOne()
  );

  useEffect(() => currentCommentRule.subscribeOne((c) => setCurrentComment(c)));

  return {
    comments,
    currentComment: currentComment?.CurrentComment,
  };
};
