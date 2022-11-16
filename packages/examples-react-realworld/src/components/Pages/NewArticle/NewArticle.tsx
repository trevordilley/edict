import { FormEvent } from 'react';
import { createArticle } from '../../../services/conduit';
import { ArticleEditor } from '../../organisms/ArticleEditor/ArticleEditor';
import { insertError } from '../../../rules/error/error';
import { parseEditArticleForm } from '../EditArticle/EditArticle';
import { windowRedirect } from '../../../rules/user/user';

export function NewArticle() {
  return <ArticleEditor onSubmit={onSubmit} />;
}

async function onSubmit(ev: FormEvent) {
  ev.preventDefault();
  const { description, body, tag, title } = parseEditArticleForm(ev);

  const result = await createArticle({
    description: description.value,
    body: body.value,
    tagList: tag.value.split(','),
    title: title.value,
  });

  result.match({
    err: (errors) => insertError(errors),
    ok: ({ slug }) => {
      windowRedirect(`#/article/${slug}`);
    },
  });
}
