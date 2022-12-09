import { FormEvent } from 'react';
import { createArticle } from '../../../services/conduit';
import { ArticleEditor } from '../../organisms/ArticleEditor/ArticleEditor';
import { parseEditArticleForm } from '../EditArticle/EditArticle';
import { useEdict } from '../../../rules/EdictContext';
import { EdictSession } from '../../../rules/session';

export function NewArticle() {
  const EDICT = useEdict();

  return <ArticleEditor onSubmit={(ev) => onSubmit(ev, EDICT)} />;
}

async function onSubmit(ev: FormEvent, EDICT: EdictSession) {
  ev.preventDefault();
  const { description, body, tag, title } = parseEditArticleForm(ev);

  const result = await createArticle({
    description: description.value,
    body: body.value,
    tagList: tag.value.split(','),
    title: title.value,
  });

  result.match({
    err: (errors) => EDICT.ERROR.ACTIONS.insertError(errors),
    ok: (article) => {
      EDICT.ARTICLE.ACTIONS.insertArticle(article);
      EDICT.USER.ACTIONS.windowRedirect(`#/article/${article}`);
    },
  });
}
