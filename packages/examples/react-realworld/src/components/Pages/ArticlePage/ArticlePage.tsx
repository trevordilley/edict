import { Option } from '@hqoss/monads';
import { format } from 'date-fns';
import React, { Fragment, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  deleteArticle,
  deleteComment,
  getArticle,
  getArticleComments,
} from '../../../services/conduit';
import { Article } from '../../../types/article';
import { Comment } from '../../../types/comment';
import { redirect } from '../../../types/location';
import { classObjectToClassName } from '../../../types/style';
import { User } from '../../../types/user';
import { TagList } from '../../organisms/ArticlePreview/ArticlePreview';
import { FetchState } from '../../../rules/schema';
import { useRuleOne } from '../../../rules/useRule';
import { useEdict } from '../../../rules/EdictContext';
import { EdictSession } from '../../../rules/session';

export interface CommentSectionState {
  comments?: Comment[];
  commentBody: string;
  submittingComment: FetchState;
}

export interface MetaSectionState {
  submittingFavorite?: FetchState;
  submittingFollow?: FetchState;
  deletingArticle?: FetchState;
}

export interface ArticlePageState {
  article: Option<Article>;
  commentSection: CommentSectionState;
  metaSection: MetaSectionState;
}

const useArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const EDICT = useEdict();
  const { ARTICLE, COMMENT, USER } = EDICT;
  const articleFacts = ARTICLE.HOOKS.useArticle(slug ?? '');
  const commentFacts = COMMENT.HOOKS.useCommentSection(slug ?? '');
  const metaFacts = ARTICLE.HOOKS.useArticleMeta(slug ?? '');
  const userFacts = USER.HOOKS.useUser();

  useEffect(() => {
    onLoad(slug ?? '', EDICT);
  }, [slug]);

  const metaSection = metaFacts;
  const user = userFacts;
  const commentSection = {
    comments: commentFacts.comments,
    commentBody: commentFacts.currentComment?.commentBody ?? '',
    submittingComment:
      commentFacts.currentComment?.submittingComment ?? FetchState.DONE,
  };
  const article = articleFacts?.$article;
  if (!commentSection || !article) {
    return undefined;
  } else {
    return {
      user,
      metaSection,
      commentSection,
      article,
    };
  }
};

export function ArticlePage() {
  const page = useArticlePage();
  if (!page) return <div>Loading...</div>;

  const { article, user, metaSection, commentSection } = page;
  return article ? (
    <div className="article-page">
      <ArticlePageBanner {...{ article, metaSection, user }} />

      <div className="container page">
        <div className="row article-content">
          <div className="col-md-12">{article.body}</div>
          <TagList tagList={article.tagList} />
        </div>

        <hr />

        <div className="article-actions">
          <ArticleMeta {...{ article, metaSection, user }} />
        </div>

        <CommentSection {...{ user, commentSection, article }} />
      </div>
    </div>
  ) : (
    <div>Loading article...</div>
  );
}

async function onLoad(slug: string, EDICT: EdictSession) {
  try {
    const article = await getArticle(slug);
    EDICT.ARTICLE.ACTIONS.insertArticle(article);
    const comments = await getArticleComments(slug);
    EDICT.COMMENT.ACTIONS.insertComments(comments);
  } catch {
    redirect('');
  }
}

function ArticlePageBanner(props: {
  article: Article;
  metaSection?: MetaSectionState;
  user?: User;
}) {
  return (
    <div className="banner">
      <div className="container">
        <h1>{props.article.title}</h1>

        <ArticleMeta {...props} />
      </div>
    </div>
  );
}

function ArticleMeta({
  article,
  user,
}: {
  article: Article;
  metaSection?: MetaSectionState;
  user?: User;
}) {
  return (
    <div className="article-meta">
      <ArticleAuthorInfo article={article} />

      {user?.username === article.author.username ? (
        <OwnerArticleMetaActions article={article} />
      ) : (
        <NonOwnerArticleMetaActions article={article} />
      )}
    </div>
  );
}

function ArticleAuthorInfo({
  article: {
    author: { username, image },
    createdAt,
  },
}: {
  article: Article;
}) {
  return (
    <Fragment>
      <Link to={`/profile/${username}`}>
        <img src={image || undefined} />
      </Link>
      <div className="info">
        <Link className="author" to={`/profile/${username}`}>
          {username}
        </Link>
        <span className="date">{format(createdAt, 'PP')}</span>
      </div>
    </Fragment>
  );
}

function NonOwnerArticleMetaActions({
  article: {
    slug,
    favoritesCount,
    favorited,
    author: { username },
  },
}: {
  article: Article;
}) {
  const { USER } = useEdict();
  const following =
    useRuleOne(USER.RULES.followingUsersRule, {
      $following: { username: [username] },
    })?.$following.following ?? false;
  return (
    <Fragment>
      <button
        className={classObjectToClassName({
          btn: true,
          'btn-sm': true,
          'btn-outline-secondary': !following,
          'btn-secondary': following,
        })}
        onClick={() => USER.ACTIONS.updateFollowing(username, following)}
      >
        <i className="ion-plus-round"></i>
        &nbsp; {(following ? 'Unfollow ' : 'Follow ') + username}
      </button>
      &nbsp;
      <button
        className={classObjectToClassName({
          btn: true,
          'btn-sm': true,
          'btn-outline-primary': !favorited,
          'btn-primary': favorited,
        })}
        onClick={() => USER.ACTIONS.toggleFavoriteArticle(slug, favorited)}
      >
        <i className="ion-heart"></i>
        &nbsp; {(favorited ? 'Unfavorite ' : 'Favorite ') + 'Article'}
        <span className="counter">({favoritesCount})</span>
      </button>
    </Fragment>
  );
}

function OwnerArticleMetaActions({ article: { slug } }: { article: Article }) {
  const EDICT = useEdict();
  return (
    <Fragment>
      <button
        className="btn btn-outline-secondary btn-sm"
        onClick={() => redirect(`editor/${slug}`)}
      >
        <i className="ion-plus-round"></i>
        &nbsp; Edit Article
      </button>
      &nbsp;
      <button
        className="btn btn-outline-danger btn-sm"
        onClick={() => onDeleteArticle(slug, EDICT)}
      >
        <i className="ion-heart"></i>
        &nbsp; Delete Article
      </button>
    </Fragment>
  );
}

async function onDeleteArticle(slug: string, EDICT: EdictSession) {
  EDICT.ARTICLE.ACTIONS.retractArticle(slug);
  await deleteArticle(slug);
  redirect('');
}

function CommentSection({
  user,
  article,
  commentSection: { submittingComment, commentBody, comments },
}: {
  user?: User;
  article: Article;
  commentSection: CommentSectionState;
}) {
  return (
    <div className="row">
      <div className="col-xs-12 col-md-8 offset-md-2">
        {user ? (
          <CommentForm
            user={user}
            slug={article.slug}
            submittingComment={submittingComment}
            commentBody={commentBody}
          />
        ) : (
          <p style={{ display: 'inherit' }}>
            <Link to="/login">Sign in</Link> or{' '}
            <Link to="/register">sign up</Link> to add comments on this article.
          </p>
        )}

        {comments ? (
          <Fragment>
            {comments.map((comment, index) => (
              <ArticleComment
                key={comment.id}
                comment={comment}
                slug={article.slug}
                user={user}
                index={index}
              />
            ))}
          </Fragment>
        ) : (
          <div>Loading comments...</div>
        )}
      </div>
    </div>
  );
}

function CommentForm({
  user: { image },
  commentBody,
  slug,
  submittingComment,
}: {
  user: User;
  commentBody: string;
  slug: string;
  submittingComment: FetchState;
}) {
  const { COMMENT } = useEdict();
  return (
    <form
      className="card comment-form"
      onSubmit={(ev) => {
        ev.preventDefault();
        COMMENT.ACTIONS.onPostCurrentComment(slug, commentBody);
      }}
    >
      <div className="card-block">
        <textarea
          className="form-control"
          placeholder="Write a comment..."
          rows={3}
          onChange={(ev) =>
            COMMENT.ACTIONS.updateCurrentCommentBody(ev.target.value)
          }
          value={commentBody}
        ></textarea>
      </div>
      <div className="card-footer">
        <img src={image || undefined} className="comment-author-img" />
        <button
          className="btn btn-sm btn-primary"
          disabled={submittingComment === FetchState.QUEUED}
        >
          Post Comment
        </button>
      </div>
    </form>
  );
}

function ArticleComment({
  comment: {
    id,
    body,
    createdAt,
    author: { username, image },
  },
  slug,
  index,
  user,
}: {
  comment: Comment;
  slug: string;
  index: number;
  user?: User;
}) {
  const EDICT = useEdict();
  return (
    <div className="card">
      <div className="card-block">
        <p className="card-text">{body}</p>
      </div>
      <div className="card-footer">
        <Link className="comment-author" to={`/profile/${username}`}>
          <img src={image || undefined} className="comment-author-img" />
        </Link>
        &nbsp;
        <Link className="comment-author" to={`/profile/${username}`}>
          {username}
        </Link>
        <span className="date-posted">{format(createdAt, 'PP')}</span>
        {user?.username === username && (
          <span className="mod-options">
            <i
              className="ion-trash-a"
              aria-label={`Delete comment ${index + 1}`}
              onClick={() => onDeleteComment(slug, id, EDICT)}
            ></i>
          </span>
        )}
      </div>
    </div>
  );
}

async function onDeleteComment(slug: string, id: number, EDICT: EdictSession) {
  await deleteComment(slug, id);
  EDICT.COMMENT.ACTIONS.retractComment(id);
  const comments = await getArticleComments(slug);
  EDICT.COMMENT.ACTIONS.insertComments(comments);
}
