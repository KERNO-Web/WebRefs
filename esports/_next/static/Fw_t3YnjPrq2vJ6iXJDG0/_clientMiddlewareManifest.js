self.__MIDDLEWARE_MATCHERS = [
  {
    "regexp": "^\\/WebRefs\\/esports(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!api|media|_next|.*\\..*).*))(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/((?!api|media|_next|.*\\..*).*)"
  }
];self.__MIDDLEWARE_MATCHERS_CB && self.__MIDDLEWARE_MATCHERS_CB()