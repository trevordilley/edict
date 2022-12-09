import { edict } from '@edict/core';
import * as decodeJwt from 'jwt-decode';
import { FetchState, HOME_TAB, ID, Schema } from './schema';
import {
  createComment,
  DEFAULT_FEED_LIMIT,
  favoriteArticle,
  followUser,
  getArticleComments,
  getArticles,
  getFeed,
  getTags,
  INITIAL_FEED_OFFSET,
  login,
  signUp,
  unfavoriteArticle,
  unfollowUser,
  updateSettings,
} from '../services/conduit';
import { Article, ArticlesFilters } from '../types/article';
import { Comment } from '../types/comment';
import { Profile } from '../types/profile';
import axios from 'axios';
import { User } from '../types/user';
import { useEffect, useState } from 'react';
import { useRule, useRuleOne } from './useRule';

export const initializeSession = () => {
  const session = edict<Schema>(true);
  const { insert, retract, conditions, rule, retractByConditions } = session;
  // Articles

  // =================== \\
  // Article Rules               \\
  // =================== \\
  const articleConditions = conditions(
    ({
      slug,
      title,
      body,
      description,
      tagList,
      createdAt,
      updatedAt,
      favorited,
      favoritesCount,
      author,
    }) => ({
      slug,
      title,
      body,
      description,
      tagList,
      createdAt,
      updatedAt,
      favorited,
      favoritesCount,
      author,
    })
  );
  const useComments = (slug: string) => {
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

  const useCommentSection = (slug: string) => {
    const comments = useComments(slug);

    const [currentComment, setCurrentComment] = useState(
      currentCommentRule.queryOne()
    );

    useEffect(() =>
      currentCommentRule.subscribeOne((c) => setCurrentComment(c))
    );

    return {
      comments,
      currentComment: currentComment?.CurrentComment,
    };
  };
  session
    .rule(
      'Changing the favorite-ness of an article updates the db',
      ({ favorited, slug, token, favoritesCount }) => ({
        $article: {
          favorited,
          slug,
          favoritesCount,
          isFavoriting: { match: FetchState.QUEUED },
        },
        Session: {
          token,
        },
      })
    )
    .enact({
      then: ({
        $article: { id, favorited, slug, favoritesCount },
        Session: { token },
      }) => {
        if (!token) {
          windowRedirect('register');
          return;
        }
        insert({
          [slug]: {
            isFavoriting: FetchState.SENT,
            favorited: !favorited,
            favoritesCount: favorited ? favoritesCount - 1 : favoritesCount + 1,
          },
        });
        const result = favorited
          ? unfavoriteArticle(slug)
          : favoriteArticle(slug);
        result.then((article) => {
          insertArticle(article);
          insert({
            [slug]: {
              isFavoriting: FetchState.DONE,
            },
          });
        });
      },
    });

  session
    .rule(
      'Changing the page or limit updates the offset',
      ({ currentPage, limit }) => ({
        ArticleList: {
          currentPage,
          limit,
        },
      })
    )
    .enact({
      then: ({ ArticleList: { currentPage, limit } }) => {
        insert({
          ArticleList: {
            offset: (currentPage - 1) * limit,
          },
        });
      },
    });

  session
    .rule(
      'changes to page filters refetches articles',
      ({
        selectedTab,
        offset,
        limit,
        tag,
        filterByAuthor,
        token,
        username,
      }) => ({
        HomePage: {
          selectedTab,
        },
        ArticleList: {
          offset,
          limit,
          filterByAuthor,
          tag,
        },
        Session: {
          token,
          username,
        },
      })
    )
    .enact({
      when: ({ Session: { token } }) => token !== undefined,
      then: async ({
        HomePage: { selectedTab },
        ArticleList: { offset, limit, tag, filterByAuthor },
      }) => {
        const filters = {
          offset,
          limit,
          tag,
          filterByAuthor,
        };
        // Remove undefined
        Object.keys(filters).forEach((key) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          filters[key] === undefined && delete filters[key];
        });

        const finalFilters = {
          ...filters,
          tag: selectedTab.slice(2),
        };

        resetArticles();
        const fetchArticles =
          selectedTab === 'Your Feed' ? getFeed : getArticles;
        const articles = await fetchArticles(
          !selectedTab.startsWith('#') ? filters : finalFilters
        );

        articles.articles.forEach((a) => insertArticle(a));
        insertArticleCount(articles.articlesCount);
      },
    });

  const resetArticlePagination = () => {
    session.insert({
      ArticleList: {
        currentPage: 1,
      },
      Tags: {
        fetchState: FetchState.QUEUED,
      },
    });
  };

  const setArticlePage = (pageIdx: number) => {
    session.insert({
      ArticleList: {
        currentPage: pageIdx,
      },
    });
  };
  // =================== \\
  // Queries             \\
  // =================== \\

  const articleRules = session
    .rule('Articles', () => ({
      $article: articleConditions,
    }))
    .enact();

  const articleMetaRule = session
    .rule('Article Meta', ({ slug }) => ({
      $articleMeta: {
        slug,
      },
    }))
    .enact();

  const articleListRule = session
    .rule('Article List', ({ articleCount, currentPage }) => ({
      ArticleList: {
        articleCount,
        currentPage,
      },
    }))
    .enact();

  // =================== \\
  // Insert/Retracts     \\
  // =================== \\
  const resetArticles = () => {
    articleRules.query().forEach((a) => {
      retractArticle(a.$article.slug);
    });
  };
  const insertArticleCount = (articleCount: number) => {
    insert({
      ArticleList: {
        articleCount,
      },
    });
  };
  const changeArticlesPage = (currentPage: number) => {
    insert({
      ArticleList: {
        currentPage,
      },
    });
  };

  const retractArticle = (slug: string) => {
    retractByConditions(slug, articleConditions);
  };

  const insertArticle = (article: Article) => {
    insert({
      [ID.ARTICLE(article)]: article,
    });
  };
  const toggleFavoriteArticle = (slug: string, favorited: boolean) => {
    session.insert({
      [slug]: {
        slug,
        favorited,
        isFavoriting: FetchState.QUEUED,
      },
    });
  };
  const loadArticlesIntoSession = async (filters: ArticlesFilters = {}) => {
    const decodedArticles = await getArticles(filters);
    decodedArticles.articles.forEach((a) => insertArticle(a));
    insertArticleCount(decodedArticles.articlesCount);
  };

  // Comments

  const insertComments = (comments: (Comment & { slug: string })[]) => {
    comments.forEach((c) => {
      insert({
        [ID.COMMENT(c.id)]: c,
      });
    });
  };

  const retractComment = (commentId: number) => {
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

  const commentRule = session
    .rule('Comments', () => ({
      $comment: commentCond,
    }))
    .enact();

  const currentCommentRule = session
    .rule('Current Comment', ({ commentBody, submittingComment }) => ({
      CurrentComment: {
        commentBody,
        submittingComment,
      },
    }))
    .enact();

  const onPostCurrentComment = (slug: string, body: string) => {
    insert({
      CurrentComment: {
        submittingComment: FetchState.QUEUED,
      },
    });

    createComment(slug, body).then((comment) => {
      insertComments([{ ...comment, slug }]);
      insert({
        CurrentComment: {
          submittingComment: FetchState.DONE,
          commentBody: undefined,
        },
      });
    });

    getArticleComments(slug).then((comments) => {
      insertComments(comments);
    });
  };

  // Errors

  const errorRule = session
    .rule('Errors', ({ errors }) => ({
      App: {
        errors,
      },
    }))
    .enact();

  //export
  const insertError = (errorObj: { [key: string]: string[] }) => {
    insert({ App: { errors: errorObj } });
  };

  // =================== \\
  // Home Rules               \\
  // =================== \\
  session
    .rule(
      'Derive available tabs based on selection and login state',
      ({ token, selectedTab }) => ({
        Session: {
          token,
        },
        HomePage: {
          selectedTab,
        },
      })
    )
    .enact({
      then: ({ Session: { token }, HomePage: { selectedTab } }) => {
        const tabs = new Set([
          HOME_TAB.GLOBAL_FEED,
          ...(token !== undefined ? [HOME_TAB.YOUR_FEED, selectedTab] : []),
        ]);
        insert({
          HomePage: {
            tabNames: [...tabs],
          },
        });
      },
    });

  // =================== \\
  // Home Queries             \\
  // =================== \\
  const homePageRule = session
    .rule('Home page', ({ selectedTab, tagList, tabNames, currentPage }) => ({
      HomePage: {
        selectedTab,
        tabNames,
      },
      ArticleList: {
        currentPage,
      },
      Tags: {
        tagList,
      },
    }))
    .enact();

  // =================== \\
  // Home Insert/Retracts     \\
  // =================== \\
  const changeHomeTab = (tab: string) =>
    insert({
      HomePage: {
        selectedTab: tab,
      },
    });

  // Profile
  const insertProfile = (profile: Profile) => {
    insert({ [ID.PROFILE(profile)]: { ...profile } });
  };

  // Auth session

  const sessionRule = session
    .rule('Session', ({ token, username }) => ({
      Session: {
        token,
        username,
      },
    }))
    .enact();

  const updateProfileSettings = (args: {
    username: string;
    password: string;
    image: string;
    bio: string;
    email: string;
  }) => {
    insert({
      [args.username]: args,
      SettingsPage: {
        fetchState: FetchState.QUEUED,
      },
    });
  };

  // Tags

  const insertAllTags = (tags: string[]) => {
    insert({
      Tags: {
        tagList: tags,
      },
    });
  };

  session
    .rule('Fetch Tags', ({ fetchState }) => ({
      Tags: {
        fetchState: { match: FetchState.QUEUED },
      },
    }))
    .enact({
      then: () => {
        insert({
          Tags: {
            fetchState: FetchState.SENT,
          },
        });
        loadTagsIntoSession().then(() => {
          insert({
            Tags: {
              fetchState: FetchState.DONE,
            },
          });
        });
      },
    });

  const tagList = session
    .rule('Tag List', ({ tagList }) => ({
      Tags: {
        tagList,
      },
    }))
    .enact();

  const loadTagsIntoSession = async () => {
    const tags = await getTags();
    insertAllTags(tags.tags);
  };

  // User

  const publicUserConditions = conditions(({ username, image, bio }) => ({
    username,
    image,
    bio,
  }));

  const userConditions = conditions(({ email, token }) => ({
    ...publicUserConditions,
    email,
  }));

  const userProfileConditions = conditions(({ following, isSubmitting }) => ({
    ...publicUserConditions,
    following,
    isSubmitting,
  }));

  const insertUser = (
    user: User,
    isSubmitting?: boolean,
    following?: boolean
  ) => {
    insert({
      [user.username]: {
        ...user,
        isSubmitting: isSubmitting ?? false,
        following: following ?? false,
      },
    });
  };

  const updateFollowing = (username: string, following: boolean) => {
    session.insert({
      [username]: {
        following,
        fetchState: FetchState.QUEUED,
      },
    });
  };

  rule('Update following status', ({ following, username, token }) => ({
    $user: {
      fetchState: { match: FetchState.QUEUED },
      following,
    },
    Session: {
      token,
    },
  })).enact({
    then: ({ $user: { id, following }, Session: { token } }) => {
      if (!token) {
        windowRedirect('register');
        return;
      }
      const toggledFollow = !following;
      insert({
        [id]: {
          fetchState: FetchState.SENT,
          following: toggledFollow,
        },
      });

      (following ? unfollowUser : followUser)(id).then((result) => {
        insert({
          [id]: {
            fetchState: FetchState.DONE,
            following: result.following,
          },
        });
      });
    },
  });

  session
    .rule(
      'Setting a token persists the token, and sets the headers for axios',
      ({ token }) => ({
        Session: {
          token,
        },
      })
    )
    .enact({
      when: ({ Session: { token } }) => token !== undefined,
      then: async ({ Session: { token } }) => {
        if (!token)
          throw new Error('Token should never be undefined in this rule!');
        const decoded = decodeJwt.default<{ username: string }>(token);
        localStorage.setItem('token', token);

        axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        insert({
          Session: {
            username: decoded.username,
          },
        });
      },
    });

  const setToken = (token?: string) => {
    insert({
      Session: {
        token,
      },
    });
  };

  const loginRule = rule(
    'Successful Login using email and password loads the user',
    ({ email, password }) => ({
      Login: {
        email,
        password,
      },
    })
  ).enact({
    then: async ({ Login: { email, password } }) => {
      const result = await login(email, password!);
      retract('Login', 'email', 'password');
      result.match({
        ok: (user) => {
          setToken(user.token);
          insertUser(user);
          windowRedirect('#/');
        },
        err: (e) => insertError(e),
      });
    },
  });

  const startRegistrationRule = rule(
    'Starting registration',
    ({ email, password, username }) => ({
      StartRegistration: {
        email,
        password,
        username,
      },
    })
  ).enact({
    then: async ({ StartRegistration: { email, password, username } }) => {
      const result = await signUp({
        username,
        email,
        password: password ?? '',
      });
      retract('StartRegistration', 'email', 'password', 'username');
      result.match({
        err: (e) => {
          insertError(e);
        },
        ok: (user) => {
          setToken(user.token);
          insertUser(user);
          windowRedirect('#/');
        },
      });
    },
  });

  /*
  // rewritten using new typesafe syntax

  export const startRegistrationRule = rule(
    'Starting registration',
    ({StartRegistration: { email, password, username }}) => ({
      StartRegistration: {
        email,
        password,
        username,
      },
    })
  ).enact({
    then: async ({ StartRegistration: { email, password, username } }) => {
      const result = await signUp({
        username,
        email,
        password: password ?? '',
      });
      session.StartRegistration.retract.email()
      session.StartRegistration.retract.password()
      session.StartRegistration.retract.username()
      result.match({
        err: (e) => {
          insertError(e);
        },
        ok: (user) => {
          session.Session.insert({
            token: user.token,
            username: user.username
          })
          session.$user(user.username).insert(user)
          windowRedirect('#/');
        },
      });
    },
  });



  export const updateSettingsRule = rule(
    'Update users information when it changes ',
    ($user) => ({
      $user,
      Session: {
        username: { join: '$user' },
      },
      SettingsPage: {
        fetchState: { match: FetchState.QUEUED },
      },
    })
  ).enact({
    then: async ({ $user }) => {
      session.SettingsPage.insert({
          fetchState: FetchState.SENT,
        })
      const result = await updateSettings($user);
      result.match({
        err: (e) => insertError(e),
        ok: (user) => {
          setToken(user.token);
          session.$user(user.username).insert(user)
          session.SettingsPage.insert({
              fetchState: FetchState.DONE,
            })
        },
      });
    },
  });
   */

  const updateSettingsRule = rule(
    'Update users information when it changes ',
    ({ username, password, image, bio, email, token }) => ({
      $user: {
        username,
        password,
        image,
        bio,
        email,
      },
      Session: {
        username: { join: '$user' },
      },
      SettingsPage: {
        fetchState: { match: FetchState.QUEUED },
      },
    })
  ).enact({
    then: async ({ $user }) => {
      insert({
        SettingsPage: {
          fetchState: FetchState.SENT,
        },
      });
      const result = await updateSettings($user);
      result.match({
        err: (e) => insertError(e),
        ok: (user) => {
          setToken(user.token);
          insertUser(user);
          insert({
            SettingsPage: {
              fetchState: FetchState.DONE,
            },
          });
        },
      });
    },
  });

  session
    .rule(
      'When the auth token is set to undefined, logout the user',
      ({ token }) => ({
        Session: {
          token,
          username: { then: false },
        },
      })
    )
    .enact({
      when: ({ Session: { token } }) => token === undefined,
      then: ({ Session: { username } }) => {
        /*
        session.$user(username).retract.all()
        session.HomePage.insert({
          tabNames: [HOME_TAB.GLOBAL_FEED],
          selectedTab: HOME_TAB.GLOBAL_FEED,
        })
        session.Session.insert({
          username: undefined
          })
       */
        retractByConditions(username, userConditions);
        insert({
          HomePage: {
            tabNames: [HOME_TAB.GLOBAL_FEED],
            selectedTab: HOME_TAB.GLOBAL_FEED,
          },
          Session: {
            username: undefined,
          },
        });
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
        windowRedirect('/');
      },
    });

  const startRegistration = ({
    username,
    email,
    password,
  }: {
    username: string;
    email: string;
    password: string;
  }) => {
    session.insert({
      StartRegistration: {
        username,
        email,
        password,
      },
    });
  };

  const updateCurrentCommentBody = (commentBody: string) => {
    insert({
      CurrentComment: {
        commentBody,
      },
    });
  };
  const windowRedirect = (location: string) => {
    // session.Page.insert({location})
    insert({
      Page: {
        location,
      },
    });
  };

  session
    .rule('Redirect when location changes', ({ location }) => ({
      Page: {
        location,
      },
    }))
    .enact({
      then: ({ Page: { location } }) => {
        window.location.hash = location;
      },
    });

  const userRule = rule('User', () => ({
    $user: userConditions,
  })).enact();

  /*
    playing with typesafe api examples
  export const userProfileRule = rule('User Profile', ({$userProfile}) => ({
    $userProfile,
  })).enact();

   */

  const userProfileRule = rule('User Profile', () => ({
    $userProfile: userProfileConditions,
  })).enact();

  const followingUsersRule = session
    .rule('Authors the user follows', ({ following, username }) => ({
      $following: {
        following,
        username,
      },
    }))
    .enact();

  const startLogin = (email: string, password: string) => {
    insert({
      Login: {
        email,
        password,
      },
    });
  };

  // Initialize Facts
  session.insert({
    App: {
      token: undefined,
      username: undefined,
      errors: {},
    },
    Session: {
      token: undefined,
    },
    HomePage: {
      selectedTab: HOME_TAB.GLOBAL_FEED,
      tabNames: [HOME_TAB.GLOBAL_FEED],
    },
    ArticleList: {
      limit: DEFAULT_FEED_LIMIT,
      offset: INITIAL_FEED_OFFSET,
      currentPage: 1,
      filterByAuthor: undefined,
      tag: undefined,
      favorited: undefined,
      articleCount: 0,
    },
    CurrentComment: {
      commentBody: '',
      submittingComment: FetchState.DONE,
    },
    Tags: {
      tagList: [],
    },
  });

  return {
    ARTICLE: {
      HOOKS: {
        useArticles: () => {
          const articles = useRule(articleRules);
          const articleCount = useRuleOne(articleListRule);

          return {
            articles: articles.map((a) => ({
              article: a.$article,
            })),
            articleCount: articleCount?.ArticleList.articleCount ?? 0,
          };
        },

        useArticle: (slug: string) => {
          const article = useRuleOne(articleRules, {
            $article: { ids: [slug] },
          });
          return article;
        },

        useArticleMeta: (slug: string) => {
          const articleMeta = useRuleOne(articleMetaRule, {
            $articleMeta: {
              ids: [slug],
            },
          });
          return articleMeta?.$articleMeta;
        },
      },
      RULES: {
        articleListRule,
        articleMetaRule,
        articleRules,
      },
      ACTIONS: {
        loadArticlesIntoSession,
        toggleFavoriteArticle,
        insertArticle,
        retractArticle,
        changeArticlesPage,
        insertArticleCount,
        resetArticles,
        resetArticlePagination,
        setArticlePage,
      },
    },
    COMMENT: {
      HOOKS: {
        useComments,
        useCommentSection,
      },
      RULES: {
        currentCommentRule,
        commentRule,
      },
      ACTIONS: {
        onPostCurrentComment,
        updateCurrentCommentBody,
        retractComment,
        insertComments,
      },
    },
    ERROR: {
      ACTIONS: { insertError },
      RULES: { errorRule },
      HOOKS: {
        useErrors: () => useRuleOne(errorRule)?.App.errors ?? {},
      },
    },
    HOME: {
      RULES: {
        homePageRule,
      },
      ACTIONS: {
        changeHomeTab,
      },
    },
    PROFILE: {
      ACTIONS: { insertProfile },
    },
    SESSION: {
      RULES: { sessionRule },
      HOOKS: {
        useSession: () => useRuleOne(sessionRule)?.Session.token,
      },
    },
    TAG: {
      QUERIES: { tagList },
      ACTIONS: { loadTagsIntoSession, insertAllTags },
    },
    USER: {
      RULES: {
        followingUsersRule,
        userProfileRule,
        userRule,
        updateSettingsRule,
        startRegistrationRule,
        loginRule,
      },
      ACTIONS: {
        startLogin,
        windowRedirect,
        setToken,
        insertUser,
        updateFollowing,
        toggleFavoriteArticle,
        startRegistration,
        updateProfileSettings,
      },
      HOOKS: {
        useUser: () => {
          const [user, setUser] = useState(userRule.queryOne()?.$user);
          useEffect(() => {
            return userRule.subscribeOne((u) => setUser(u?.$user));
          });

          return user;
        },
      },
    },
  };
};

export type EdictSession = ReturnType<typeof initializeSession>;
