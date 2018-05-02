/* eslint-disable no-constant-condition */

import { take, put, call, fork, select, retry } from 'redux-saga/effects'
import fetch from 'isomorphic-fetch'
import * as actions from '../actions'
import { selectedRedditSelector, postsByRedditSelector } from '../reducers/selectors'

export function fetchPostsApi(reddit) {
  return fetch(`http://www.reddit.com/r/${reddit}.json`)
    .then(response => response.json())
    .then(json => json.data.children.map(child => child.data))
}

export function* fetchPosts(reddit) {
  console.log('fetching posts')
  yield Promise.reject()
  yield put(actions.requestPosts(reddit))
  const posts = yield call(fetchPostsApi, reddit)
  yield put(actions.receivePosts(reddit, posts))
}

export function* invalidateReddit() {
  while (true) {
    const { reddit } = yield take(actions.INVALIDATE_REDDIT)
    yield call(fetchPosts, reddit)
  }
}

export function* nextRedditChange() {
  while (true) {
    const prevReddit = yield select(selectedRedditSelector)
    yield take(actions.SELECT_REDDIT)

    const newReddit = yield select(selectedRedditSelector)
    const postsByReddit = yield select(postsByRedditSelector)
    if (prevReddit !== newReddit && !postsByReddit[newReddit]) yield fork(fetchPosts, newReddit)
  }
}

export function* startup() {
  const selectedReddit = yield select(selectedRedditSelector)
  yield fork(fetchPosts, selectedReddit)
}

export function* retrySaga() {
  const selectedReddit = yield select(selectedRedditSelector)
  try {
    yield retry(3, 1000, fetchPosts, selectedReddit)
  } catch(error) {
    debugger
  }
}

export default function* root() {
  // yield fork(startup)
  yield fork(nextRedditChange)
  yield fork(invalidateReddit)
  yield fork(retrySaga)
}
