import { session } from '../session';
import { Comment } from '../../types/comment';
import { FetchState, ID } from '../schema';
import { createComment, getArticleComments } from '../../services/conduit';

const { insert, retract, rule, conditions } = session;

export const insertComments = (comments: (Comment & { slug: string })[]) => {
  comments.forEach((c) => {
    insert({
      [ID.COMMENT(c.id)]: c,
    });
  });
};

export const retractComment = (commentId: number) => {
  retract(
    ID.COMMENT(commentId),
    'slug',
    'createdAt',
    'updatedAt',
    'body',
    'author'
  );
};

const commentCond = conditions(
  ({ id, slug, createdAt, updatedAt, body, author }) => ({
    id,
    slug,
    createdAt,
    updatedAt,
    body,
    author,
  })
);

export const commentRule = rule('Comments', () => ({
  $comment: commentCond,
})).enact();

export const currentCommentRule = rule(
  'Current Comment',
  ({ commentBody, submittingComment }) => ({
    CurrentComment: {
      commentBody,
      submittingComment,
    },
  })
).enact();

export const onPostCurrentComment = (slug: string, body: string) => {
  insert({
    CurrentComment: {
      submittingComment: FetchState.QUEUED,
    },
  });

  Promise.all([createComment(slug, body), getArticleComments(slug)]).then(
    () => {
      insert({
        CurrentComment: {
          submittingComment: FetchState.DONE,
          commentBody: undefined,
        },
      });
    }
  );
};

export const retractAllComments = () => {
  commentRule.query().forEach((c) => retractComment(c.$comment.id));
};
