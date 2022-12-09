import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getArticle, updateArticle } from '../../../services/conduit';
import { ArticleEditor } from '../../organisms/ArticleEditor/ArticleEditor';
import { useEdict } from '../../../rules/EdictContext';
import { EdictSession } from '../../../rules/session';

export type EditArticleFormFields<T extends React.FormEvent['currentTarget']> =
  T & {
    title: { value: string };
    description: { value: string };
    body: { value: string };
    tag: { value: string };
  };

export const parseEditArticleForm = (ev: React.FormEvent) =>
  ev.currentTarget as EditArticleFormFields<typeof ev.currentTarget>;

export function EditArticle() {
  const { slug } = useParams<{ slug: string }>();
  const EDICT = useEdict();
  useEffect(() => {
    if (!slug) return;
    _loadArticle(slug, EDICT);
  }, []);

  if (!slug) return <></>;
  return <SluggedArticle slug={slug} />;
}

const SluggedArticle: React.FC<{ slug: string }> = ({ slug }) => {
  const EDICT = useEdict();
  const article = EDICT.ARTICLE.HOOKS.useArticle(slug);
  console.log('Loading slugged?', article);
  return (
    <ArticleEditor
      onSubmit={onSubmit(slug, EDICT)}
      article={article?.$article}
    />
  );
};

async function _loadArticle(slug: string, EDICT: EdictSession) {
  const user = EDICT.USER.RULES.userRule.queryOne();
  const { windowRedirect } = EDICT.USER.ACTIONS;
  try {
    const article = await getArticle(slug);

    if (article.author.username !== user?.$user.username) {
      windowRedirect('#/');
      return;
    }
    EDICT.ARTICLE.ACTIONS.insertArticle(article);
  } catch {
    windowRedirect('#/');
  }
}

function onSubmit(
  slug: string,
  EDICT: EdictSession
): (ev: React.FormEvent) => void {
  return async (ev) => {
    ev.preventDefault();
    const { title, description, body, tag } = parseEditArticleForm(ev);
    const tagList = tag.value.split(',');
    const result = await updateArticle(slug, {
      title: title.value,
      description: description.value,
      body: body.value,
      tagList,
    });

    result.match({
      err: (errors) => EDICT.ERROR.ACTIONS.insertError(errors),
      ok: (article) => {
        EDICT.ARTICLE.ACTIONS.insertArticle(article);
        EDICT.USER.ACTIONS.windowRedirect(`#/article/${article.slug}`);
      },
    });
  };
}
