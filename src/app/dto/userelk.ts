export interface PostUserBody {
    id: number,
    title: string,
    username: string,
    password: string
}

export interface PostUserResult {
    hits: {
      total: number;
      hits: Array<{
        _source: PostUserBody;
      }>;
    };
}