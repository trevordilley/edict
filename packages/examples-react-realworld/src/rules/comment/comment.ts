import { session } from '../session';
import { Comment } from '../../types/comment';
import { ID } from '../schema';

const { insert, retract } = session;

export const insertComments = (comments: Comment[]) => {
  comments.forEach((c) => {
    insert({
      [ID.COMMENT(c.id)]: c,
    });
  });
};

export const retractComment = (commentId: number) => {
  retract(ID.COMMENT(commentId), 'createdAt', 'updatedAt', 'body', 'author');
};
