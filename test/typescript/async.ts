import { take, put, call, fork, select } from '../../effects';
import createSagaMiddleware, {SagaIterator} from "../../index";

declare function fetch(url: string): Promise<any>;

declare const actions: any;

const selectedRedditSelector = (state: any): any => state.selectedReddit
const postsByRedditSelector = (state: any): any => state.postsByReddit

function fetchPostsApi(reddit: string) {
  return fetch(`http://www.reddit.com/r/${reddit}.json` )
    .then(response => response.json() )
    .then(json => json.data.children.map((child: any) => child.data) )
}

function* fetchPosts(reddit: string): SagaIterator {
  yield put( actions.requestPosts(reddit) )
  const posts = yield call(fetchPostsApi, reddit)
  yield put( actions.receivePosts(reddit, posts) )
}

function* invalidateReddit(): SagaIterator {
  while (true) {
    const {reddit} = yield take(actions.INVALIDATE_REDDIT)
    yield call( fetchPosts, reddit )
  }
}

function* nextRedditChange(): SagaIterator {

  while(true) {
    const prevReddit = yield select(selectedRedditSelector)
    yield take(actions.SELECT_REDDIT)

    const newReddit = yield select(selectedRedditSelector)
    const postsByReddit = yield select(postsByRedditSelector)
    if(prevReddit !== newReddit && !postsByReddit[newReddit])
      yield fork(fetchPosts, newReddit)
  }
}

function* startup(): SagaIterator {
  const selectedReddit = yield select(selectedRedditSelector)
  yield fork(fetchPosts, selectedReddit)
}

export default function* root(): SagaIterator {
  yield fork(startup)
  yield fork(nextRedditChange)
  yield fork(invalidateReddit)
}


const sagaMiddleware = createSagaMiddleware();

sagaMiddleware.run(root);
