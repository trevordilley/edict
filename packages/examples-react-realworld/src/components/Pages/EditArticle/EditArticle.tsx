import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getArticle, updateArticle } from '../../../services/conduit';
import { ArticleEditor } from '../../organisms/ArticleEditor/ArticleEditor';
import { userRule, windowRedirect } from '../../../rules/user/user';
import { insertError } from '../../../rules/error/error';
import { useArticle } from '../../../rules/article/useArticle';

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

  useEffect(() => {
    if (!slug) return;
    _loadArticle(slug);
  }, []);

  if (!slug) return <></>;
  return <SluggedArticle slug={slug} />;
}

const SluggedArticle: React.FC<{ slug: string }> = ({ slug }) => {
  const article = useArticle(slug);
  console.log('Loading slugged?', article);
  return (
    <ArticleEditor onSubmit={onSubmit(slug)} article={article?.$article} />
  );
};

async function _loadArticle(slug: string) {
  const user = userRule.queryOne();
  try {
    const article = await getArticle(slug);

    if (article.author.username !== user?.$user.username) {
      windowRedirect('#/');
      return;
    }
  } catch {
    windowRedirect('#/');
  }
}

function onSubmit(slug: string): (ev: React.FormEvent) => void {
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
      err: (errors) => insertError(errors),
      ok: ({ slug }) => {
        windowRedirect(`#/article/${slug}`);
      },
    });
  };
}
