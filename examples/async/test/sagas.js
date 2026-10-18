import { test, expect } from 'vitest'
import { call, fork, put, select, take } from 'redux-saga/effects'
import { fetchPosts, fetchPostsApi, invalidateReddit, nextRedditChange, startup } from '../src/sagas'
import * as actions from '../src/actions'
import { postsByRedditSelector, selectedRedditSelector } from '../src/reducers/selectors'

test('fetchPosts Saga', () => {
  const mockPosts = [1, 2, 3]
  const redditName = 'react_reddit'
  const generator = fetchPosts(redditName)
  expect(generator.next().value, 'must dispatch a requestPosts action').toEqual(put(actions.requestPosts(redditName)))
  expect(generator.next().value, 'must call fetchPostsApi with reddit name').toEqual(call(fetchPostsApi, redditName))
  expect(generator.next(mockPosts).value, 'must dispatch a receivePosts action with posts').toEqual(
    put(actions.receivePosts(redditName, mockPosts)),
  )
  expect(generator.next().done, 'must finish').toBe(true)
})

test('invalidateReddit Saga', () => {
  const generator = invalidateReddit()
  expect(generator.next().value, 'must take a SELECT_REDDIT action').toEqual(take(actions.INVALIDATE_REDDIT))
  expect(generator.next({ reddit: 'new_reddit_1' }).value, 'must call fetchPosts with new reddit').toEqual(
    call(fetchPosts, 'new_reddit_1'),
  )
  expect(generator.next().value, 'must go back to beginning of loop').toEqual(take(actions.INVALIDATE_REDDIT))
})

test('nextRedditChange Saga when switching to new reddit', () => {
  const generator = nextRedditChange()
  expect(generator.next().value, 'must select current reddit from store').toEqual(select(selectedRedditSelector))
  expect(generator.next('prev_reddit').value, 'must take a SELECT_REDDIT action').toEqual(take(actions.SELECT_REDDIT))
  expect(generator.next().value, 'must select newly selected reddit from store').toEqual(select(selectedRedditSelector))
  expect(generator.next('new_reddit').value, 'must select posts by reddit from store').toEqual(
    select(postsByRedditSelector),
  )
  expect(generator.next({}).value, "delegate to fetchPosts for new reddit's posts").toEqual(
    fork(fetchPosts, 'new_reddit'),
  )
  expect(generator.next().value, 'must go back to beginning of loop').toEqual(select(selectedRedditSelector))
})

test('nextRedditChange Saga when same reddit is selected', () => {
  const generator = nextRedditChange()
  generator.next()
  generator.next('prev_reddit')
  generator.next()
  generator.next('prev_reddit')
  expect(generator.next().value, 'must go back to beginning of loop').toEqual(select(selectedRedditSelector))
})

test('nextRedditChange Saga when posts were previously loaded', () => {
  const generator = nextRedditChange()
  generator.next()
  generator.next('prev_reddit')
  generator.next()
  generator.next('new_reddit')
  const postsByReddit = {
    new_reddit: ['cached_post'],
  }
  expect(generator.next(postsByReddit).value, 'must go back to beginning of loop').toEqual(
    select(selectedRedditSelector),
  )
})

test('startup Saga', () => {
  const generator = startup()
  expect(generator.next().value, 'gets currently selected reddit').toEqual(select(selectedRedditSelector))
  expect(generator.next('selected_reddit').value, 'delegates to fetchPosts to get posts').toEqual(
    fork(fetchPosts, 'selected_reddit'),
  )
  expect(generator.next().done, 'must finish').toBe(true)
})
